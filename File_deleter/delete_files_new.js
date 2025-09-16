const liczbaStron = 1;

for (let j = 1; j <= liczbaStron; j++) { 
try {
 document.querySelector("#root > div.workspace-page.workspace-page--desktop-app > div.workspace-page__wrapper > div > div.workspace-page__content > div.workspace-main-content > div > div.workspace-main-content__main-view > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list > div:nth-child(1) > div.file-options > div > button:nth-child(3)").click();
 await new Promise(resolve => setTimeout(resolve, 100)); // 0.1 sec
 document.querySelector("#root > div.workspace-page.workspace-page--desktop-app > div.workspace-page__wrapper > div > div.workspace-page__content > div.workspace-main-content > div > div.workspace-main-content__main-view > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list > div:nth-child(1) > div.file-options > div > button:nth-child(3)").click(); 
 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec
 document.querySelector("#root > div.popover__container.popover__no-transparent.file-actions-menu__container > div.popover-item.popover-item--isWarning").click(); 
 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec
 document.querySelector("#root > div.modal-dialog__transition-wrapper > div.modal-dialog.modal-dialog--modalPosition-desktop > div > div.modal-dialog__footer.modal-dialog__footer--hasFooterSeparator > button.primary-button.undefined").click();
 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec
   }
      catch(err) {
 
}
 //document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > span").click(); 
 //document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > div.dropdown-menu-dialog > div > div:nth-child(1)").click();
 //await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec


	// Utwórz zmienną reprezentującą liczbę elementów do przeszukania
	const liczbaElementow = document.querySelector("#root > div.workspace-page.workspace-page--desktop-app > div.workspace-page__wrapper > div > div.workspace-page__content > div.workspace-main-content > div > div.workspace-main-content__main-view > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list").childElementCount;

	// Utwórz pętlę, aby iterować przez wszystkie elementy
	for (let i = 1; i <= liczbaElementow; i++) {
	 const querySelectorString = `#root > div.workspace-page.workspace-page--desktop-app > div.workspace-page__wrapper > div > div.workspace-page__content > div.workspace-main-content > div > div.workspace-main-content__main-view > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list > div:nth-child(${i}) > div.file-options`;

	 // Ustaw styl na 'flex' dla danego elementu
	 const element = document.querySelector(querySelectorString);
	 if (element) {
		element.style.display = 'flex';
	 }

	 // Kliknij w odpowiedni element
	 const clickSelectorString = `#root > div.workspace-page.workspace-page--desktop-app > div.workspace-page__wrapper > div > div.workspace-page__content > div.workspace-main-content > div > div.workspace-main-content__main-view > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list > div:nth-child(${i}) > div.file-options > div > button:nth-child(3)`;
	 const clickElement = document.querySelector(clickSelectorString);
	 if (clickElement) {
		try {
     clickElement.click();      
    console.log('ok');
    await new Promise(resolve => setTimeout(resolve, 500));
      }
catch(err) {
 
}
	 }
	  
	 // Na koniec wykonaj ostatni krok poza pętlą
		const ostatniKrokSelector = "#root > div.popover__container.popover__no-transparent.file-actions-menu__container > div.popover-item.popover-item--isWarning";
		const ostatniKrokElement = document.querySelector(ostatniKrokSelector);
		if (ostatniKrokElement) {
      try {
		 ostatniKrokElement.click();
          document.querySelector("#root > div.modal-dialog__transition-wrapper > div.modal-dialog.modal-dialog--modalPosition-desktop > div > div.modal-dialog__footer.modal-dialog__footer--hasFooterSeparator > button.MuiButtonBase-root.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeMedium.MuiButton-containedSizeMedium.MuiButton-colorPrimary.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeMedium.MuiButton-containedSizeMedium.MuiButton-colorPrimary.css-1w5aw91").click();
      }
      catch(err) {
 
}
		}

		// Wykonaj ostatni krok poza pętlą
		const buttonSelector = "#root > div.modal-dialog__transition-wrapper > div.modal-dialog.modal-dialog--modalPosition-desktop > div > div.modal-dialog__footer.modal-dialog__footer--hasFooterSeparator > button.primary-button.undefined";
		const buttonElement = document.querySelector(buttonSelector);
		if (buttonElement) {
      try {
		 buttonElement.click();
      }
      catch(err) {
 
}
		}
	  
	}

try {
		 document.querySelector("#WORKSPACE_PAGE > div.workspace-page__wrapper > div > div.workspace-page__content > div.workspace-main-content > div > div.workspace-main-content__main-view > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__pagination > nav > ul > li:nth-child(3) > button").click();
      }
      catch(err) {
 
}
  try {
		 document.querySelector("#WORKSPACE_PAGE > div.workspace-page__wrapper > div > div.workspace-page__content > div.workspace-main-content > div > div.workspace-main-content__main-view > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__pagination > nav > ul > li:nth-child(1) > button").click();
      }
      catch(err) {
 
}

}
