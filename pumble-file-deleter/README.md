# Pumble — usuń pliki

Rozszerzenie Chrome (Manifest V3) na `https://app.pumble.com/*`. Panel pojawia się tylko na widoku Files.

Na stronie listy (maks. 40 plików) klika **Select all**, potem kosz na pasku „N Selected” i potwierdzenie, jeśli Pumble je pokaże. Nie klika plików po jednym. Nie używa tokena i nie kasuje wiadomości.

Następną stronę otwiera tylko wtedy, gdy paginacja ma kontrolkę z nazwą `Next page` albo `Następna strona` i lista naprawdę się zmienia. Inaczej zostaje przy jednej stronie.

## Instalacja (rozpakowane)

1. Otwórz `chrome://extensions` (albo `edge://extensions`).
2. Włącz tryb dewelopera.
3. „Załaduj rozpakowane” i wskaż ten katalog: `pumble-file-deleter`.
4. Wejdź na `https://app.pumble.com`, otwórz Files i ustaw filtr (na siebie, jeśli nie kasujesz cudzych plików).
5. W panelu w rogu: **Usuń widoczne** → potwierdź. **Stop** przerywa przed kolejną stroną.
