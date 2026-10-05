# Pumble — usuń pliki

Rozszerzenie Chrome (Manifest V3) na `https://app.pumble.com/*`. Panel pojawia się tylko na widoku Files.

Na każdej stronie klika checkbox **Select all** w `header-actions__checkbox`, potem przycisk w piątym `div` paska `header-actions__actions` (pojawia się dopiero po zaznaczeniu) i `button.confirmation-modal__confirm-btn`, jeśli modal jest. Nie klika plików po jednym. Nie używa tokena i nie kasuje wiadomości.

Liczba w panelu pochodzi z nagłówka, tekst w stylu `Files (250)`, plus numer strony z paginacji. Kasowanie idzie od końca: najpierw ostatni numer strony w `file-browser__pagination nav > ul` (nie strzałka dalej), potem Select all i kosz. Po skasowaniu strony wraca na poprzednią — strzałką wstecz albo nowym ostatnim numerem — aż zniknie strona 1. Strzałki dalej nie używa.

## Instalacja (rozpakowane)

1. Otwórz `chrome://extensions` (albo `edge://extensions`).
2. Włącz tryb dewelopera.
3. „Załaduj rozpakowane” i wskaż ten katalog: `pumble-file-deleter`.
4. Wejdź na `https://app.pumble.com`, otwórz Files i ustaw filtr (na siebie, jeśli nie kasujesz cudzych plików).
5. W panelu w rogu: **Usuń widoczne** → potwierdź. **Stop** przerywa przed kolejnym kasowaniem.
