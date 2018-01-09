class Website{
    constructor(iconUrl, title, url, entryTime, exitTime){
        this.iconUrl = iconUrl,
        this.title = title,
        this.url = url,
        this.timeArray = new Array(new TimeSpend(entryTime, exitTime))
    }
}

class TimeSpend{
    constructor(entryTime, exitTime){
        this.entryTime = entryTime,
        this.exitTime = exitTime
    }
    get duration(){
        this.calcDuration();
    }

    //change to function
    calcDuration(){
        return moment(this.exitTime).substract(this.entryTime);
    }
}

var uniqueUrls = [];
var websites = [];
var currentWebsite;
var urlRegex = /[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;

//--Chrome Extension section
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(tab.status !== "complete" || !tab.active || changeInfo.status === undefined)
        return;

    console.log(`Tab has been updated`);
    //console.log(tab);
    tabChangedOrUpdated(tab);
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    if(activeInfo.tabId == "")
        return;

    getCurrentSelectedTab(activeInfo.tabId);
});

function getCurrentSelectedTab(tabId){
    chrome.tabs.get(tabId, function(tab) {
        console.log(`selected tab has changed`);
        //console.log(tab);
        tabChangedOrUpdated(tab);
    });
}

//--functions of URLs
function urlParser(url){
    var element = document.createElement('a');
    element.href = url;

    return element.hostname;
}

//--add website or time to website
function tabChangedOrUpdated(tab){
    let parsedUrl = urlParser(tab.url);
    
    //scenariusz ze strony np. do historii, nowej karty itd.
    if(!urlRegex.test(parsedUrl)){
        console.log(`urlError: ${parsedUrl}`);
        return;
    }

    if(currentWebsite == null){
        currentWebsite = new Website(tab.favIconUrl, tab.title, parsedUrl, moment().format('LTS'), null);
        return;
    }
    else if(currentWebsite.url === parsedUrl){
        return;
    }

    currentWebsite.timeArray[0].exitTime = moment().format('LTS');
    console.log("Byłem na poniższej stronie");
    console.log(currentWebsite);

    //tu nie działa dodawanie nowych stron
    if(uniqueUrls.indexOf(currentWebsite.url) === -1){
        uniqueUrls.push(parsedUrl);    
        websites.push(currentWebsite);
    }else{
        addTimeToExisingWebsite(tab);
    }

    currentWebsite = new Website(tab.favIconUrl, tab.title, parsedUrl, moment().format('LTS'), null);
}


//to be continued...
function addTimeToExisingWebsite(){
    let index = websites.findIndex(element => element.url == currentWebsite.url);
    
    if(index === -1){
        console.log("coś poszło nie tak przy sprawdzaniu czy strona istnieje w bazie");
        return;
    }

    var timeTracked = new TimeSpend(currentWebsite.entryTime, currentWebsite.exitTime);
    websites[index].timeArray.push(timeTracked);
}