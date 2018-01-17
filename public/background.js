class Website{
    constructor(url, title, iconUrl, entryTime, exitTime){
        this.url = url,
        this.title = title,
        this.iconUrl = iconUrl,
        this.timeArray = new Array(new TimeSpend(entryTime, exitTime))
    }

    calcTimeDuration(format){
        var result = 0;
        for(var i = 0; i < this.timeArray.length; i++){
            result += this.timeArray[i].duration;
        }

        return format ? moment(result).utcOffset(0).format("HH:mm:ss") : result;            
    }

    //function to get proper site title
}

class TimeSpend{
    constructor(entryTime, exitTime){
        this.entryTime = entryTime,
        this.exitTime = exitTime,
        this.duration = this.calcDuration(false)
    }

    calcDuration(format){
        var entry = moment(this.entryTime, "HH:mm:ss");
        var exit = moment(this.exitTime, "HH:mm:ss");
        var result = exit.diff(entry);

        return format ? moment(result).utcOffset(0).format("HH:mm:ss") : result;
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

//--add new website or time to website to website array
function tabChangedOrUpdated(tab){
    let parsedUrl = urlParser(tab.url);
    var isBadUrl = !urlRegex.test(parsedUrl);

    if(isBadUrl && currentWebsite == null){
        return;
    }
    else if(currentWebsite == null){
        currentWebsite = new Website(parsedUrl, tab.title, tab.favIconUrl, getCurrentTime(), null);
        return;
    }
    else if(currentWebsite.url === parsedUrl){
        return;
    }

    currentWebsite.timeArray[0].exitTime = getCurrentTime();
    
    if(uniqueUrls.indexOf(currentWebsite.url) === -1){
        uniqueUrls.push(currentWebsite.url);    
        websites.push(currentWebsite);
    }else{
        addTimeToExisingWebsite();
    }

    if(isBadUrl){
        currentWebsite = null;    
    }else{
        currentWebsite = new Website(parsedUrl, tab.title, tab.favIconUrl, getCurrentTime(), null);
    }
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

//-- additional MomentJS functions
function getCurrentTime(){
    return moment().format("HH:mm:ss");
}

function parseToHHmmss(value){
    return moment(value).utcOffset(0).format("HH:mm:ss");
}

//--saving data
//https://developer.chrome.com/extensions/storage
//http://julip.co/2010/01/how-to-build-a-chrome-extension-part-2-options-and-localstorage/




//--Checking functions
function logTimeForWebsite(index){
    var result = websites[index].calcTimeSpend();
    return parseToHHmmss(result);
}

function logTimeForAllWebsites(){
    var arr = [];
    for(var i = 0; i < websites.length; i++){
        var timeS = logTimeForAllWebsites(i);

        var obj = {
            url: websites[i].url,
            time: timeS
        };

        arr.push(obj);
    }
    console.log(arr);
}