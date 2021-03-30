#!/usr/bin/env node

import {
  DiagnosticSeverity,
  TextDocuments,
  createConnection,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

interface DiagnosticChunk {
  value: string;
  index: number;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const getPlanets = (text: string): DiagnosticChunk[] => {
  const planets = [
    'pluto',
    'venus',
    'earth',
    'mars',
    'jupyter',
    'saturn',
    'neptune',
    'uranus',
  ];

  const regex = new RegExp(`\\b(${planets.join('|')})\\b`, 'g');
  const results = [];

  let matches;
  while ((matches = regex.exec(text)) && results.length < 100) {
    results.push({
      value: matches[0],
      index: matches.index,
    })
  }

  return results;
};

const planetToDiagnostic = (textDocument: TextDocument) => ({
  index,
  value,
}: DiagnosticChunk) => ({
  severity: DiagnosticSeverity.Warning,
  range: {
    start: textDocument.positionAt(index),
    end: textDocument.positionAt(index + value.length),
  },
  message: `${value} is a planet. Might wanna capitalize it to "${capitalize(value)}"`,
  source: 'PlanetChecker',
});

const getDiagnostics = (textDocument: TextDocument) =>
  getPlanets(textDocument.getText()).map(planetToDiagnostic(textDocument));

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => {
  // https://docs.microsoft.com/en-us/dotnet/api/microsoft.visualstudio.languageserver.protocol.textdocumentsynckind?view=visualstudiosdk-2019
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
    },
  };
});

documents.onDidChangeContent((change) => {
  connection.sendDiagnostics({
    uri: change.document.uri,
    diagnostics: getDiagnostics(change.document),
  });
});

documents.listen(connection);
connection.listen();
