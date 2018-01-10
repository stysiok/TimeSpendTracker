class Website{
    constructor(url, title, iconUrl, entryTime, exitTime){
        this.url = url,
        this.title = title,
        this.iconUrl = iconUrl,
        this.timeArray = new Array(new TimeSpend(entryTime, exitTime))
    }
}

class TimeSpend{
    constructor(entryTime, exitTime){
        this.entryTime = entryTime,
        this.exitTime = exitTime
    }

    get duration() {
        return this.calcDuration();
    }

    calcDuration(){
        var entry = moment(this.entryTime, "HH:mm:ss");
        var exit = moment(this.exitTime, "HH:mm:ss");

        var result = exit.diff(entry);

        return moment(result).utcOffset(0).format('HH:mm:ss');
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
    console.log(tab);
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
        console.log(tab);
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
        currentWebsite = new Website(parsedUrl, tab.title, tab.favIconUrl, getCurrentTime(), null);
        return;
    }
    else if(currentWebsite.url === parsedUrl){
        return;
    }

    currentWebsite.timeArray[0].exitTime = getCurrentTime();
    console.log("Byłem na poniższej stronie");
    console.log(currentWebsite);

    
    if(uniqueUrls.indexOf(currentWebsite.url) === -1){
        uniqueUrls.push(currentWebsite.url);    
        websites.push(currentWebsite);
    }else{
        addTimeToExisingWebsite(tab);
    }

    currentWebsite = new Website(parsedUrl, tab.title, tab.favIconUrl, getCurrentTime(), null);
}

function addTimeToExisingWebsite(){
    let index = websites.findIndex(element => element.url == currentWebsite.url);
    
    if(index === -1){
        console.log("coś poszło nie tak przy sprawdzaniu czy strona istnieje w bazie");
        return;
    }

    var timeTracked = new TimeSpend(currentWebsite.timeArray[0].entryTime, currentWebsite.timeArray[0].exitTime);
    websites[index].timeArray.push(timeTracked);
}

function getCurrentTime(){
    return moment().format("HH:mm:ss");
}

