async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

document.addEventListener('DOMContentLoaded', async function() {
  const tab = await getCurrentTab();

  // get current tab
  const tabTitle = document.getElementById('title');

  // fetch options are equal for every request
  // this key is limited by 500 requests per month
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Host': 'hotels4.p.rapidapi.com',
      'X-RapidAPI-Key': '2a63f19a68msh9e485d469d05eb5p1b7da6jsna18265ba2986'
    }
  };

  // take only the first word (or anything before whitespace) of the tab title for the upcoming query
  const query = tab.title.split(' ')[0];

  // div to write to
  const divResponse = document.getElementById('response');
  // p to display hotel name
  const pName = document.getElementById('name');
  // p to display "You may also like:" or "No hotels found"
  const pStatic = document.getElementById('static');

  // IDs for queries
  let destinationId = "";
  let id = "";

  // send request with query derived from title to the free Hotels API
  fetch(`https://hotels4.p.rapidapi.com/locations/v2/search?query=${query}`, options)
    .then(response => response.json())
    .then(response => {
      if (response && response.suggestions[0] && response.suggestions[0].entities[0] && response.suggestions[0].entities[0].destinationId) {
	destinationId = response.suggestions[0].entities[0].destinationId;
      } else {
	// if no hotels found change "You may also like:" text
	pStatic.innerHTML = "No hotels found";
      }

      if (destinationId) {
	// send request with destinationId and dummy required parameters to get hotel ID
	fetch(`https://hotels4.p.rapidapi.com/properties/list?destinationId=${destinationId}&pageNumber=1&pageSize=1&checkIn=2020-01-08&checkOut=2020-01-15&adults1=1`, options)
	  .then(response => response.json())
	  .then(response => {
	    if (response.result == "OK") {
	      // display hotel name if found
	      pName.innerHTML = response.data.body.searchResults.results[0].name;
	      id = response.data.body.searchResults.results[0].id;

	      if (id) {
		// send request to finally get a picture of the hotel
		fetch(`https://hotels4.p.rapidapi.com/properties/get-hotel-photos?id=${id}`, options)
		  .then(response => response.json())
		  .then(response => {
		    if (response.hotelImages[0]) {
		      // create an image element
		      const imgHotelImage = document.createElement('img');
		      // choose small size among image sizes and construct the source for the image
		      imgHotelImage.src = response.hotelImages[0].baseUrl.replace("{size}", "s");
		      // display the image
		      divResponse.appendChild(imgHotelImage);
		    } else {
		      // if there is no image (not tested)
		      const pNoImage = document.createElement('p');
		      pNoImage.innerHTML = "No image found";
		      divResponse.appendChild(pNoImage);
		    }
		  })
		  .catch(err => {
		    // if any error occurs just display it to shame the extension developer
		    pStatic.innerHTML = err;
		  });
	      }
	    }
	  })
	  .catch(err => {
	    pStatic.innerHTML = err;
	  });
      }
    })
    .catch(err => {
      pStatic.innerHTML = err;
    });

}, false);
