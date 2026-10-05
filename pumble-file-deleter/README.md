# Pumble — usuń pliki

Rozszerzenie Chrome (Manifest V3) na `https://app.pumble.com/*`. Panel pojawia się tylko na widoku Files.

Na każdej stronie klika checkbox **Select all** w `header-actions__checkbox`, potem przycisk w piątym `div` paska `header-actions__actions` (pojawia się dopiero po zaznaczeniu) i `button.confirmation-modal__confirm-btn`, jeśli modal jest. Nie klika plików po jednym. Nie używa tokena i nie kasuje wiadomości.

Liczba w panelu pochodzi z nagłówka, tekst w stylu `Files (250)`, plus numer strony z paginacji. Kasowanie: odczytaj numery stron (środek `nav > ul`, bez strzałek), wejdź na największy numer, Select all, kosz, poczekaj sekundę (pasek w panelu się rusza), wróć na stronę 1 i odczytaj nowy maksimum. Strzałki dalej i wstecz nie są używane.

## Instalacja (rozpakowane)

1. Otwórz `chrome://extensions` (albo `edge://extensions`).
2. Włącz tryb dewelopera.
3. „Załaduj rozpakowane” i wskaż ten katalog: `pumble-file-deleter`.
4. Wejdź na `https://app.pumble.com`, otwórz Files i ustaw filtr (na siebie, jeśli nie kasujesz cudzych plików).
5. W panelu w rogu: **Usuń widoczne** → potwierdź. **Stop** przerywa przed kolejnym kasowaniem.
