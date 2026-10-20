# Codequalität

KISS, DRY und YAGNI pragmatisch anwenden. Lesbarkeit geht vor cleveren Abstraktionen. Keine spekulativen Klassen, generischen Frameworks oder unnötige Modulfragmentierung. Fachlogik möglichst als pure Functions mit expliziten Parametern und Rückgaben halten; Seiteneffekte auf UI und Speicherung begrenzen. Keine versteckten globalen Zustände.

Fehlerfälle nachvollziehbar behandeln: keine leeren `catch`-Blöcke, ignorierten Warnungen, deaktivierten Tests ohne Begründung, ungenutzten Funktionen, toten Codepfade oder unnötiges Logging. Dateien und Funktionen überschaubar halten; fachlich zusammengehörigen Code nicht künstlich trennen.
