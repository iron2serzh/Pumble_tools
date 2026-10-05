# Pumble — usuń pliki

Rozszerzenie Chrome (Manifest V3) na `https://app.pumble.com/*`. Panel pojawia się tylko na widoku Files.

Na każdej stronie klika checkbox **Select all** (`div.pmbl-checkbox.header-actions__checkbox input`). Sukcesem zaznaczenia nie jest `input.checked` — to własny `div.pmbl-checkbox`. Sukcesem jest nowy przycisk `header-actions__actions > div:nth-child(5) > button`, którego nie było przed kliknięciem. Piąty przycisk paska filtrów nie jest koszem. Jeśli sam input nie otworzy paska, rozszerzenie klika widoczny `div.pmbl-checkbox` zdarzeniami pointerdown, mousedown, mouseup i click. Potem czeka na `button.confirmation-modal__confirm-btn`. Nie klika plików po jednym. Nie używa tokena i nie kasuje wiadomości.

Liczba w panelu pochodzi z nagłówka, tekst w stylu `Files (250)`. W trakcie biegu widać krok: `Zaznaczam`, `Klikam kosz`, `Potwierdzam`, `Czekam`, `Odświeżam`, `Strona N`. Po skasowaniu strony kliknięcie strony 1 zostawia listę i paginację nieodświeżone, więc rozszerzenie nie czyta wtedy nowego maksimum i nie klika Select all. Odświeża sortowaniem: otwiera `.sort-dropdown.file-browser__sort`, wybiera drugą opcję i wraca na pierwszą, tak jak stary skrypt konsoli. Dopiero gdy zmieni się nagłówek albo numery stron, czyta nowe maksimum (środek `nav > ul`, bez strzałek) i kasuje tę stronę. Gdy kontrolki sortowania nie ma, otwiera inną pozostałą stronę i dopiero potem stronę 1. `Gotowe` pojawia się dopiero, gdy nagłówek spadnie do zera. Jeśli bieg stanie na zaznaczaniu, ostatnia linia mówi, czy input był na stronie i czy pojawił się nowy kosz.

## Instalacja (rozpakowane)

1. Otwórz `chrome://extensions` (albo `edge://extensions`).
2. Włącz tryb dewelopera.
3. „Załaduj rozpakowane” i wskaż ten katalog: `pumble-file-deleter`.
4. Wejdź na `https://app.pumble.com`, otwórz Files i ustaw filtr (na siebie, jeśli nie kasujesz cudzych plików).
5. W panelu w rogu: **Usuń widoczne** → potwierdź. **Stop** przerywa przed kolejnym kasowaniem.
