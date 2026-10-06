# Pumble — usuń pliki

Rozszerzenie Chrome (Manifest V3) na `https://app.pumble.com/*`. Panel pojawia się tylko na widoku Files.

Na każdej stronie klika checkbox **Select all** (`div.pmbl-checkbox.header-actions__checkbox input`). Sukcesem zaznaczenia nie jest `input.checked` — to własny `div.pmbl-checkbox`. Sukcesem jest nowy przycisk `header-actions__actions > div:nth-child(5) > button`, którego nie było przed kliknięciem. Piąty przycisk paska filtrów nie jest koszem. Jeśli sam input nie otworzy paska, rozszerzenie klika widoczny `div.pmbl-checkbox` zdarzeniami pointerdown, mousedown, mouseup i click. Potem czeka na `button.confirmation-modal__confirm-btn`. Nie klika plików po jednym. Nie używa tokena i nie kasuje wiadomości.

Liczba w panelu pochodzi z nagłówka, tekst w stylu `Files (250)`. Ostatnia realna strona to `ceil(N / 40)`, nie najwyższy numer w pagerze. Numery powyżej tego są duchami. Po całkowitym skasowaniu strony jej numer zostaje w pagerze i w tym biegu nie jest klikany drugi raz. W trakcie widać krok: `Zaznaczam`, `Klikam kosz`, `Potwierdzam`, `Czekam`, `Odświeżam`, `Pusta strona`, `Strona N`. Pusta strona (jest checkbox, nie ma kosza ani kart `file-list-view` / `file-grid-view`) nie kończy biegu. Paginacja wtedy znika, więc powrót robi sortowanie albo klik w nagłówek Files, a potem kasowana jest kolejna niższa realna strona. `Gotowe` pojawia się dopiero, gdy nagłówek spadnie do zera. `Nie doszło` jest tylko wtedy, gdy strona, na której powinny być pliki, nadal się nie zaznacza.

## Instalacja (rozpakowane)

1. Otwórz `chrome://extensions` (albo `edge://extensions`).
2. Włącz tryb dewelopera.
3. „Załaduj rozpakowane” i wskaż ten katalog: `pumble-file-deleter`.
4. Wejdź na `https://app.pumble.com`, otwórz Files i ustaw filtr (na siebie, jeśli nie kasujesz cudzych plików).
5. W panelu w rogu: **Usuń widoczne** → potwierdź. **Stop** przerywa przed kolejnym kasowaniem.
