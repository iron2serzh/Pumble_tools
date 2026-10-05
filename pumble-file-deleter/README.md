# Pumble — usuń pliki

Rozszerzenie Chrome (Manifest V3) na `https://app.pumble.com/*`. Panel pojawia się tylko na widoku Files.

Na każdej stronie klika checkbox **Select all** (`div.pmbl-checkbox.header-actions__checkbox input`). Dopiero gdy input jest zaznaczony, klika nowy przycisk `header-actions__actions > div:nth-child(5) > button`. Piąty przycisk, który jest na pasku filtrów przed zaznaczeniem, nie jest koszem. Potem czeka na `button.confirmation-modal__confirm-btn` i klika go. Brak modala jest nieudanym krokiem, chyba że nagłówek już spadł. Nie klika plików po jednym. Nie używa tokena i nie kasuje wiadomości.

Liczba w panelu pochodzi z nagłówka, tekst w stylu `Files (250)`, plus numer strony z paginacji. W trakcie biegu widać krok: `Zaznaczam`, `Klikam kosz`, `Potwierdzam`, `Czekam`, `Strona 1`, `Strona N`. Kasowanie: odczytaj numery stron (środek `nav > ul`, bez strzałek), wejdź na największy numer, Select all, kosz, potwierdzenie, poczekaj sekundę (pasek w panelu się rusza), wróć na stronę 1 i odczytaj nowy maksimum. Strzałki dalej i wstecz nie są używane. `Gotowe` pojawia się dopiero, gdy nagłówek spadnie do zera. Jeśli bieg stanie wcześniej, ostatnia linia nazywa krok, na przykład `Nie doszło: Potwierdzam`.

## Instalacja (rozpakowane)

1. Otwórz `chrome://extensions` (albo `edge://extensions`).
2. Włącz tryb dewelopera.
3. „Załaduj rozpakowane” i wskaż ten katalog: `pumble-file-deleter`.
4. Wejdź na `https://app.pumble.com`, otwórz Files i ustaw filtr (na siebie, jeśli nie kasujesz cudzych plików).
5. W panelu w rogu: **Usuń widoczne** → potwierdź. **Stop** przerywa przed kolejnym kasowaniem.
