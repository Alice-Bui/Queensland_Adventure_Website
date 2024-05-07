//Global variable
let photos = []; //stores photos data objects
let recentViewPhotos = []; 
let nrequests;
let nreceived;
let nrestrict;


//start - initialisations
$(function() {//alias for $(document).ready() = $()
    $.get("./data/destinations.json", function(destinationData){
        display(destinationData)
    })

    buttonControl();
});


/////////////////Display All Destinations in the List//////////////////
function display(destinationData) {
    let destinationList = ""; //page content
    let destinationNav = `<li><a class="onscreenPage">Home</a></li>`; //navigation bar

    for (let i=0; i<destinationData.destinations.length; i++){
        destinationList +=  
        `<figure address="${destinationData.destinations[i].address}">
            <img src= "${destinationData.destinations[i].link}" alt="${destinationData.destinations[i].address}">
            <figcaption>${destinationData.destinations[i].address}</figcaption>
        </figure>`

        destinationNav += `<li><a>${destinationData.destinations[i].address}</a></li>`
    }
    $("#list-thumbnails").html(destinationList);
    $(".navBar ul").html(destinationNav);

    /////////Click on the destination thumbnail////////////
    $('#list-thumbnails figure').each(function(index){ //iterate over each #list-thumbnails 'figure' element
        $(this).click(function(){
            //hide the destination List
            $("#list").css('display', 'none'); 

            //Clear the previous data
            $("#destination-thumbnails").html('');
            $("#destination-weather").html('');
            $("#destination h1").html('');

            //show the Selected Destination
            let address = $(this).attr('address');
            $("#destination").css('display', 'block');
            $("#destination h1").html(address);
            getWeather(address);

            //navigation appearance
            $('.navBar a').removeAttr('class'); /* Remove "onscreenPage" class from all links in Navigation*/
            $('.navBar a').filter(function() {
                return $(this).html() == address;
            }).attr('class', 'onscreenPage'); // Assign "onscreenPage" class to the clicked link
        })
    })

   /////////Click on the navigation link//////////// 
   $('.navBar a').each(function(index){
    $(this).click(function(){
        let address = $(this).html();
        $('.navBar a').removeAttr('class'); /* Remove "onscreenPage" class from all links in Navigation*/
        $('.navBar a').filter(function() {
            return $(this).html() == address;
        }).attr('class', 'onscreenPage'); // Assign "onscreenPage" class to the clicked link

        //Clear the previous data
        $("#destination-thumbnails").html('');
        $("#destination-weather").html('');
        $("#destination h1").html('');

        if (address != "Home") { 
            /* in case we don't want to load the same page content 
            ->add other condition "$("#destination h1").html() != address"*/
            $("#list").css('display', 'none');
            $("#destination").css('display', 'block');
            $("#destination h1").html(address);
            getWeather(address);
        } else {
            $("#list").css('display', 'block');
            $("#destination").css('display', 'none');
        }
    })
   })
}

///////////////////////Display Weather for each destination/////////////////////////////////
function getWeather(address) {
    let API_KEY = "key=620362dd4506411187b201116242404";
    address = address.replaceAll(" ", "+")
    let getWeatherStr = "https://api.weatherapi.com/v1/forecast.json?days=1&aqi=no&alerts=no" 
    + "&" + API_KEY + "&q=" + address;
    $.get(getWeatherStr, function(data) {
        let weather = {
            temp: data.current.temp_c,
            condition: data.current.condition.text,
            maxtemp: data.forecast.forecastday[0].day.maxtemp_c + "°",
            mintemp: data.forecast.forecastday[0].day.mintemp_c + "°",
            feelslike: data.current.feelslike_c + "°",
            rain: data.forecast.forecastday[0].day.daily_chance_of_rain + "%",
            wind: data.current.wind_kph + "km/h",
            uv: data.forecast.forecastday[0].day.uv,
        }
        let lastupdatedTime = new Date(data.current.last_updated);
        weather.lastupdated = lastupdatedTime.toUTCString();
        showWeather(weather);
        //too many asynchronusasynchronous requests can lead to performance issues, especially if they are being made simultaneously
        //put the getGeoLocation here so that we can execute API fetch request in order
        getGeoLocation(address); 
    })
}

function showWeather(weather) {
    let htmlContent = 
    `<h2>${weather.temp}°</h2>
    ${weather.condition}<br>
    H: ${weather.maxtemp}     L: ${weather.mintemp}
    <div>&#x1F321; Feels like: ${weather.feelslike}   |     
    &#x2602; Rain: ${weather.rain}   |   &#x1F32C; Wind: ${weather.wind}   |    &#x2600; UV: ${weather.uv}</div>
    <p>Last updated: ${weather.lastupdated}</p>`

    $("#destination-weather").html(htmlContent);
    if (weather.temp > 22) {
        $("#destination-weather h2").css("color", "#D9BD9C")
    } else {
        $("#destination-weather h2").css("color", "#3A7D8C")
    }
}

///////////////////////Display thumbnails for each destination/////////////////////////////////

//Identify Lattitude & Longtitude from Google Map API
function getGeoLocation(address) {
    let API_KEY = "key=AIzaSyC0yYrXrJTVUNhPI91mfGtYwrx-O8yqBSs";
    let getGeoLocationStr = "https://maps.googleapis.com/maps/api/geocode/json?"
    + API_KEY + "&address=" + address;
    
    $.get(getGeoLocationStr, function(data) {
        let lat = data.results[0].geometry.location.lat;
        let lng = data.results[0].geometry.location.lng;
        searchPhoto(address, lat, lng);
    })
}

//Search for photo data with the context & location same with the address
function searchPhoto(address, lat, lng) {
    photos = [];
    let API_KEY = "api_key=a279357e0a7056780a558a70660bd488";
    let searchStr = "https://www.flickr.com/services/rest/?method=flickr.photos.search&sort=relevance&per_page=200&extras=views%2C+date_taken&format=json&nojsoncallback=1"
    + "&" + API_KEY + "&text=" + address + "&lat=" + lat + "&lon=" + lng;
    $.get(searchStr, function(data){
        fetchPhoto(data, 6)
    });
}

//Fetch the required number of photos with specific condition for high quality (views>2000)
function fetchPhoto(data, requestNum) {
    nrequests = requestNum;
    nrestrict = 0;
    nreceived = 0;
    for (let i=0; i<data.photos.photo.length; i++) {
        if (nrequests === nrestrict) {
            break;
        };
        let photo = data.photos.photo[i];
        if (photo.views > 3000) { //quality photo
            let photoObj = {id: photo.id, title: photo.title};
            photoObj.date = photo.datetaken.slice(0, 10);
            photos.push(photoObj);
            getSizes(photoObj);
            nrestrict++;
        };
    };
}

//Get specific size url for a photo
function getSizes(photoObj) {
    let API_KEY = "api_key=a279357e0a7056780a558a70660bd488";
    let getSizesStr = "https://www.flickr.com/services/rest/?method=flickr.photos.getSizes&format=json&nojsoncallback=1"
    + "&" + API_KEY + "&photo_id=" + photoObj.id;

    $.get(getSizesStr, function(data) {
        photoObj.thumbnail = data.sizes.size[0].source;
        photoObj.recentView = data.sizes.size[0].source;
        photoObj.full = data.sizes.size[data.sizes.size.length-1].source;

        for (let i=0; i<data.sizes.size.length; i++) {
            let size = data.sizes.size[i];
            //thumbnail size
            if (size.label === "Small") {
                photoObj.thumbnail = size.source;
            }
            //recent view size
            if (size.label === "Large Square") {
                photoObj.recentView = size.source;
            }
            //full size
            if (size.label === "Large") {
                photoObj.full = size.source;
            }
        }
        nreceived++;
        if (nrequests == nreceived){
            showThumbnails(photos, '#destination-thumbnails');
        }        
    })
}
///////// For both Page Content & Recent View
function showThumbnails(photosArray, id) {
    let htmlContent = ""
    for (let i = 0; i<photosArray.length; i++) {
        htmlContent += 
        `<figure data-full="${photosArray[i].full}" data-view="${photosArray[i].recentView}" 
            caption="${photosArray[i].title}" date="${photosArray[i].date}">

            <img src = "${photosArray[i].thumbnail}" alt = ${photosArray[i].title}></a>
            <figcaption>
                ${photosArray[i].title} <br>
                <${photosArray[i].date}>
            </figcaption>

        </figure>`
    }
    $(id).html(htmlContent);
    showModal(id)
}

/////////////////////////Modal//////////////////////////
function showModal(id) {
    $(id + ' figure').each(function(index){ //iterate over each DOM 'figure' element in a jQuery object
        $(this).click(function(){ //$(this) is the current figure element
            //Open the modal
            $('#modal-container').css('display', 'block');
            $('#modal-content').attr('src', $(this).attr('data-full'));
            $('#modal-caption').html($(this).attr('caption') + ' <' + $(this).attr('date') + '>');

            //Add info into recent view
            let viewPhoto = {
                thumbnail: $(this).attr('data-view'),
                recentView: $(this).attr('data-view'),
                full: $(this).attr('data-full'),
                title: $(this).attr('caption'),
                date: $(this).attr('date')
            }
            
            //finding index of the 1st item in the array that match a condition (==viewPhoto)
            let existIndex = recentViewPhotos.findIndex(item => JSON.stringify(item) === JSON.stringify(viewPhoto));

            // -1 means no item found => !== -1 means the photo's already existed in the array
            if (existIndex !== -1) {
                recentViewPhotos.splice(existIndex, 1); //remove 1 item at the existIndex
            }
            if (recentViewPhotos.length == 5) {
                recentViewPhotos.splice(4, 1);
            }
            //pushing photo
            recentViewPhotos.unshift(viewPhoto); //push to the beginning of the array
            showThumbnails(recentViewPhotos, '#recentView-thumbnails')
        })
    })
}


///////////////////////////////////Button Control///////////////////////////////////////
function buttonControl() {
    //Button control <Recent View & Modal>
    $('#recentView-close').click(function(){
        $('#recentView-thumbnails').css('display', 'none');
        $('#recentView-close').css('display', 'none');
        $('#recentView-open').css('display', 'block');
    });

    $('#recentView-open').click(function(){
        $('#recentView-thumbnails').css('display', 'flex');
        $('#recentView-close').css('display', 'block');
        $('#recentView-open').css('display', 'none');
    });

    $('#modal-close').click(function(){
        $('#modal-container').css('display', 'none'); //hide the modal
        $('#modal-content').attr('src', ''); //clear the src attribute
    });

    //move-button control
    $("#move-button").click(function() {
        $('html, body').animate({ //Perform a custom animation of a set of CSS properties.
            scrollTop: $("main").offset().top //get the top position of the element
                        - (0.06 * $(window).height()) //padding gap of the main
        }, 700); // Adjust the scroll speed (700 milliseconds)
    })

    //back-button control
    $("#back-button").click(function(){
        $("#list").css('display', 'block');
        $("#destination").css('display', 'none');
        $("#destination-thumbnails").html('');
        $("destination-weather").html('');
    })

    //Side navigation button control
    $("#nav-open").click(function(){
        $("#sideNav").css('display', 'block');
    })
    $("#nav-close").click(function(){
        $("#sideNav").css('display', 'none');
    })
}

