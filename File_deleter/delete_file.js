// Create a variable that represents the number of pages to search
const lnop = document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__pagination > span:nth-child(2)").textContent.slice( document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__pagination > span:nth-child(2)").textContent.indexOf("of") + 3);


for (let j = 1; j <= lnop; j++) { 

 document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > span").click();
 await new Promise(resolve => setTimeout(resolve, 100)); // 0.1 sec
 document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > div.dropdown-menu-dialog > div > div:nth-child(1)").click(); 
 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec
 document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > span").click(); 
 document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > div.dropdown-menu-dialog > div > div:nth-child(2)").click();
 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec
 document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > span").click(); 
 document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__actions > span.file-browser__actions__controls > span.sort-dropdown.file-browser__sort > div.dropdown-menu-dialog > div > div:nth-child(1)").click();
 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec


	// Create a variable that represents the number of items to search
	const lnoi = document.querySelector("#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list").childElementCount;

	// Create a loop to iterate through all elements
	for (let i = 1; i <= lnoi; i++) {
	  const querySelectorString = `#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list > div:nth-child(${i}) > div.file-options`;

	  // Set the style to 'flex' for the given element
	  const element = document.querySelector(querySelectorString);
	  if (element) {
		element.style.display = 'flex';
	  }

	  // Click on the appropriate item
	  const clickSelectorString = `#root > div.workspace-page > div.workspace-main-content > div.workspace-main-content__wrapper > div.workspace-main-content__main-view > div > div > div.file-browser > div.file-browser__wrapper > div.file-browser__scroll-provider > div.file-browser__list > div:nth-child(${i}) > div.file-options > div > div`;
	  const clickElement = document.querySelector(clickSelectorString);
	  if (clickElement) {
		clickElement.click();
	  }
	  
	  // Finally, take the last step outside the loop
		const lastStepSelector = "#root > div.popover__container.popover__no-transparent.file-actions-menu__container > div.popover-item.popover-item--isWarning";
		const lastStepSelectorElement = document.querySelector(lastStepSelector);
		if (lastStepSelectorElement) {
		  lastStepSelectorElement.click();
		}

		// Take the last step outside the loop
		const buttonSelector = "#root > div.modal-dialog__transition-wrapper > div.modal-dialog > div > div.modal-dialog__footer > button.primary-button.undefined";
		const buttonElement = document.querySelector(buttonSelector);
		if (buttonElement) {
		  buttonElement.click();
		}
	  
	}


}