class Website{
    constructor(url, iconUrl, entryTime, exitTime){
        this.url = url,
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
}

class TimeSpend{
    constructor(entryTime, exitTime){
        this.entryTime = entryTime,
        this.exitTime = exitTime
    }

    get duration(){
        return this.calcDuration();
    }

    calcDuration(format){
        var entry = moment(this.entryTime, "HH:mm:ss");
        var exit = moment(this.exitTime, "HH:mm:ss");
        
        return exit.diff(entry);
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
    var parsedUrl = urlParser(tab.url);
    var isBadUrl = !urlRegex.test(parsedUrl);

    if(isBadUrl && currentWebsite == null){
        return;
    }
    else if(currentWebsite == null){
        currentWebsite = new Website(parsedUrl, tab.favIconUrl, getCurrentTime(), null);
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
        currentWebsite = new Website(parsedUrl, tab.favIconUrl, getCurrentTime(), null);
    }
}

function addTimeToExisingWebsite(){
    var index = websites.findIndex(element => element.url == currentWebsite.url);
    
    if(index === -1){
        console.log("coś poszło nie tak przy sprawdzaniu czy strona istnieje w bazie");
        return;
    }

    var timeTracked = new TimeSpend(currentWebsite.timeArray[0].entryTime, currentWebsite.timeArray[0].exitTime);
    websites[index].timeArray.push(timeTracked);
}

//--saving data
//https://developer.chrome.com/extensions/storage
//http://julip.co/2010/01/how-to-build-a-chrome-extension-part-2-options-and-localstorage/
chrome.windows.onRemoved.addListener(function(windowId){
    chrome.windows.getAll(function(windows){
        if(windows.length != 0)
            return;
        
       saveDataToStorage();
    })
})

function saveDataToStorage(){
    //getDataFromStorage
    //function to get keys for period of time
    var key = moment().format("DD-MM-YYYY");

    chrome.storage.sync.get(key, function(items){
        for(var i = 0; i < items.length; i++){
            var index = websites.findIndex(element => element.url == items[i].url);

            if(index !== -1){
                var times = items[i].timeArray;
                for(var j = 0; j < times.length; j++){
                    //needs to be sorted bcs time will be ealier than current time
                    websites[index].timeArray.push(new TimeSpend(times[j].entryTime, times[j].exitTime));
                }

                items.splice(i, 1);
            }
        }
        
        if(items.length != 0){
            //map rest of the data from storage to Website's objects
        }
    });
    //map
    //saveDataToStorage
}

var mapItemsToWebsites = (items) => {
    var mapedWebsites = [];
    for(var i = 0; i < items.length; i++){
        var website = new Website();

        mappedWebsites.push(website);
    }

    return mapedWebsites;
}

//-- additional MomentJS functions
function getCurrentTime(){
    return moment().format("HH:mm:ss");
}

function parseToHHmmss(value){
    return moment(value).utcOffset(0).format("HH:mm:ss");
}

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