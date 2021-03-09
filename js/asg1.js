// used Charts.js API which can be found at: https://www.chartjs.org/docs/

document.addEventListener("DOMContentLoaded", function() {
    const countryString = "http://www.randyconnolly.com/funwebdev/3rd/api/stocks/companies.php";
    const stocksURL = "http://www.randyconnolly.com/funwebdev/3rd/api/stocks/history.php?symbol=";
    const wrapDiv = document.querySelector("#credits");
    const filterBox = document.querySelector("#filterCompanies");
    const resultsList = document.querySelector("#companyList");
    const companyDetails = document.querySelector("#companyDetails");
    const filterCompanies = document.querySelector("#filterCompanies");
    const companyList = document.querySelector("#list-companies");
    const companyInfoHeader = document.querySelector("#company-info section h2");
    const stockDiv = document.querySelector("#stockFormDiv");
    const stockDivHeader = document.querySelector("#stock-data h2");
    const stockDivSecondary = document.querySelector("#stockFormSecondary");
    const stockDivSecondaryHeader = document.querySelector("#stock-data-secondary h2");
    
    
    let creditLoop = true;
    let compList = [];
    let stockData = [];
    let markerLatLong = {lat: null, lng: null };
    let marker = null;
    let worldMap = null;
    let selectedCompany = null;
    let candleStickData = [];
    initDisplayElementHide()

    initMap();
    
    // hides elements on load
    function initDisplayElementHide() {
        filterCompanies.style.display = "none";
        filterLabel.style.display = "none";
        resultsList.style.display = "none";
        companyDetails.style.display = "none";
        companyInfoHeader.style.display = "none";
        stockDiv.style.display = "none";
        stockDivHeader.style.display = "none";
        stockDivSecondary.style.display = "none";
        stockDivSecondaryHeader.style.display = "none";
        document.querySelector("#clearFilter").style.display = "none";
    }

    // Event listener for credit section at the top of the page - display names of developers
    document.querySelector('#credits').addEventListener('mouseover', (e) => {
        if (e.target.nodeName.toLowerCase() == 'i' || e.target.nodeName.toLowerCase() == 'h3') {
            if (creditLoop) {
                creditLoop = false;
                const names = document.createElement("div");
                names.innerHTML = "Created by Angela Li and Braedon Taylor";
                names.classList = "credit-class"
                wrapDiv.appendChild(names);
                setTimeout(function() {
                    creditLoop = true;
                    wrapDiv.removeChild(names);
                }, 5000);
            }
        }
    });

    // Event listener for the "Go" button
    document.querySelector('#popCompanyList').addEventListener('click', (e) => {
        fetchCoListInitial();
        // localStorage.setItem("companies", "");
    });

    // Event listener for the "Clear Filter" button
    document.querySelector('#clearFilter').addEventListener('click', (e) => {
        refreshCoList();
        filterBox.value = "";
    });

    // Event listener for when a list element is clicked
    document.querySelector('#companyList').addEventListener('click', (e) => {
        if (e.target.nodeName.toLowerCase() == 'li') {
            highlightListItem(e);
            popCompanyInfo(e);
            fetchStocks(e);
            companyDetails.style.display = "block";
            stockDivSecondaryHeader.style.display = "block";
            stockDivHeader.style.display = "block";
            companyInfoHeader.style.display = "block";
            moveMapMarker(e, worldMap);
        }
    });

    // Event listener for the "Filter" input box
    document.querySelector('#filterCompanies').addEventListener('input', (e) => {
        if (e.target.value != "") {
            filterCompaniesList(e.target.value);
        }
        else {
            popCoList(compList);
        }
    });

    //code inspired by https://flaviocopes.com/how-to-add-event-listener-multiple-elements-javascript/
    document.querySelectorAll('.toggleChartButton').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleChartView(selectedCompany);
            popFinancials(selectedCompany);
            
            if(selectedCompany != null && document.querySelector("#chartView").classList.contains("showSection")){
            createBarChart(selectedCompany);
            createCandleChart(stockData);
            createLineChart(stockData);
            }
        });
    });
    
    document.querySelector('#stockFormDiv').addEventListener('click', (e) => {
        if (e.target.nodeName.toLowerCase() == 'th') {
            sortStocks(e.target.innerHTML);
        }
    });
    
    document.querySelector('.speak-button').addEventListener('click', (e) => {
        
        if(selectedCompany != null){
        speak(selectedCompany.description);
        }
        
    });
// used https://developer.mozilla.org/en-US/docs/Web/API/Window/speechSynthesis for refernce
    function speak(text) {

	let msg = new SpeechSynthesisUtterance();
    let voices = speechSynthesis.getVoices();
	msg.text = text;
	window.speechSynthesis.speak(msg);
}                                                        
                                                             
    // Move the map marker to the specified company location
    function moveMapMarker(companyListEvent, currentMap){
    
            if (companyListEvent.target.textContent == selectedCompany.name) {
                markerLatLong = {lat: selectedCompany.latitude, lng: selectedCompany.longitude };
                if(marker != null){
                    marker.setMap(null);
                    marker = null;
                }
                worldMap.setZoom(12);
                marker = new google.maps.Marker({
                    position: markerLatLong,
                    title: selectedCompany.address,
                    map: currentMap
                });
                worldMap.panTo(marker.position);
            }
    }
    
    // Load map for the first time
    function initMap() {
        worldMap = new google.maps.Map(document.querySelector('#mapMain'), {
            center : {lat: 30.0599153, lng: 31.262019913},
            zoom: 1
        });
    }

    // Fetches the companies for the first time and sets appropriate states for related elements
    function fetchCoListInitial() {
        document.querySelector("#popCompanyList").style.display = "none";
        const loader = generateLoader();
        companyList.appendChild(loader);
        let compJ = localStorage.getItem("companies");
        if (!compJ) {
            fetch(countryString).then(response => response.json()).then(data => {
                let json = JSON.stringify(data);
                localStorage.setItem("companies", json);
                compList = JSON.parse(localStorage.getItem("companies"));
                popCoList(compList);
                companyList.removeChild(loader);
                filterCompanies.style.display = "block";
                filterLabel.style.display = "block";
                resultsList.style.display = "block";
                document.querySelector("#clearFilter").style.display = "block";
            } ).catch(error => console.error(error));
        }
        else {
            compList = JSON.parse(compJ);
            popCoList(compList);
            companyList.removeChild(loader);
            filterCompanies.style.display = "block";
            filterLabel.style.display = "block";
            resultsList.style.display = "block";
            document.querySelector("#clearFilter").style.display = "block";
        }
    }

    // Refreshes the company data
    function refreshCoList() {
        let compJ = localStorage.getItem("companies");
        if (!compJ) {
            fetch(countryString).then(response => response.json()).then(data => {
                let json = JSON.stringify(data);
                localStorage.setItem("companies", json);
                compList = JSON.parse(localStorage.getItem("companies"));
                popCoList(compList);
            } ).catch(error => console.error(error));
        }
        else {
            compList = JSON.parse(compJ);
            popCoList(compList);
        }

    }

    // Populates the company list given an array of companies
    function popCoList(popArray) {
        resultsList.innerHTML = "";
        for (let el of popArray) {
            let countryItem = document.createElement("li");
            countryItem.innerHTML = el.name;
            countryItem.setAttribute("id", "countryItem");
            resultsList.appendChild(countryItem);
        }
    }

    // Resets the list of companies
    function resetCoList() {
        resultsList.innerHTML = "";
        companyDetails.innerHTML = "";
    }

    // Populates the company information area
    function popCompanyInfo(companyListItem) {
        companyDetails.innerHTML = "";
        selectedCompany = compList.find(company => company.name == companyListItem.target.textContent);
            if (selectedCompany != null) {
                if (selectedCompany.symbol != "") {
                    let imgString = "../logos/" + selectedCompany.symbol + ".svg";
                    const logo = document.createElement("img");
                    const symbol = document.createElement("p");
                    const name = document.createElement("p");
                    const sector = document.createElement("p");
                    const subindustry = document.createElement("p");
                    const address = document.createElement("p");
                    const website = document.createElement("p");
                    const exchange = document.createElement("p");
                    const description = document.createElement("p");
                    logo.src = imgString;
                    logo.setAttribute("id", "logoPhoto");
                    symbol.textContent = `Symbol: ${selectedCompany.symbol}`;
                    name.textContent = `Name: ${selectedCompany.name}`;
                    sector.textContent = `Sector: ${selectedCompany.sector}`;
                    subindustry.textContent = `SubIndustry: ${selectedCompany.subindustry}`;
                    address.textContent = `Address: ${selectedCompany.address}`;
                    website.textContent = `Website: ${selectedCompany.website}`;
                    exchange.textContent = `Exchange: ${selectedCompany.exchange}`;
                    description.textContent = `Description: ${selectedCompany.description}`;
                    companyDetails.appendChild(logo);
                    companyDetails.appendChild(symbol);
                    companyDetails.appendChild(name);
                    companyDetails.appendChild(sector);
                    companyDetails.appendChild(subindustry);
                    companyDetails.appendChild(address);
                    companyDetails.appendChild(website);
                    companyDetails.appendChild(exchange);
                    companyDetails.appendChild(description);
                    changeCompanyAndSymbolHeader(selectedCompany);
                    companyDescription(selectedCompany);
                }
                else {
                    const notFound = document.createElement("p");
                    notFound.innerHTML = "Details are not available at this time";
                    companyDetails.appendChild(notFound);
                }
            }
        }

    // Filters the list of companies given input text
    function filterCompaniesList(inputText) {
        let filterList = compList;
        filterList = compList.filter(word => word.name.toLowerCase().startsWith(inputText.toLowerCase()));
        popCoList(filterList);
    }
    
    // Creates a loader and returns it
    function generateLoader() {
        // The following code was inspired by https://epic-spinners.epicmax.co/ 
        // All credit goes to Epicmax and Vasili Savitski
        const outerDiv = document.createElement("div");
        outerDiv.className = "orbit-spinner";
        for (let i = 0; i < 3; i++) {
            const innerDiv = document.createElement("div");
            innerDiv.className = "orbit";
            outerDiv.appendChild(innerDiv);
        }
        return outerDiv;
        // End of code inspired by https://epic-spinners.epicmax.co/
        // credit to Epicmax and Vasili Savitski
    }

    function popFinancials(selectedCompany){
        const financialTable = document.querySelector('#financial-table-body');
        financialTable.innerHTML = "";
         if(selectedCompany != null && selectedCompany.financials == null){
            const h3 = document.createElement('h3');
            h3.textContent = "No financial information to be displayed";
            h3.setAttribute("id", "noFinancialMessageTable");
            financialTable.appendChild(h3);   
        }
        else{ 
        for( let i = 0; i < selectedCompany.financials.years.length; i++){
            const trFinancial = document.createElement("tr");
            const tdYear = document.createElement("td");
            const tdRevenue = document.createElement("td");
            const tdEarnings = document.createElement("td");
            const tdAssets = document.createElement("td");
            const tdLiabilities = document.createElement("td");
            tdYear.textContent = selectedCompany.financials.years[i]
            tdRevenue.textContent = selectedCompany.financials.revenue[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            tdEarnings.textContent = selectedCompany.financials.earnings[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            tdAssets.textContent = selectedCompany.financials.assets[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            tdLiabilities.textContent = selectedCompany.financials.liabilities[i].toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            trFinancial.appendChild(tdYear);
            trFinancial.appendChild(tdRevenue);
            trFinancial.appendChild(tdEarnings);
            trFinancial.appendChild(tdAssets);
            trFinancial.appendChild(tdLiabilities);
            financialTable.appendChild(trFinancial);
        }
        }
    }
        
    
    // Highlights a list item that it is passed through css
    function highlightListItem(companyListItem){
      let activeList = document.querySelectorAll('.active');
        for(let a of activeList){
            a.classList.remove("active");
        }
        companyListItem.target.classList.add('active');
    }

    // Fetches stock data based on the list item passed
    function fetchStocks(stock) {
        for (c of compList) {
            if (stock.target.textContent == c.name) {
                localStorage.setItem("stockdata", "");
                queryString = stocksURL + c.symbol
                let stockJ = localStorage.getItem("stockdata");
                if (!stockJ) {
                    fetch(queryString).then(response => response.json()).then(data => {
                        let json = JSON.stringify(data);
                        localStorage.setItem("stockdata", json);
                        stockData = JSON.parse(localStorage.getItem("stockdata"));
                        stockDiv.style.display = "block";
                        stockDivSecondary.style.display = "block";
                        popStockData(stockData);
                        popStockSecondary(stockData);
                    } ).catch(error => console.error(error));
                }
                else {
                    stockData = JSON.parse(stockJ);
                    console.log(stockData);
                    popStockData(stockData);
                    popStockSecondary(stockData);
                }
            }
        }
    }

    //populates the primary stock information area
    function popStockData(sD) {
        stockDiv.innerHTML = "";
        const tbl = document.createElement("table");
        stockHd = stockHeader();
        tbl.appendChild(stockHd);
        for (stockListing of sD) {
            const trStockRow = document.createElement("tr");
            const dateVal = document.createElement("td");
            const openVal = document.createElement("td");
            const closeVal = document.createElement("td");
            const lowVal = document.createElement("td");
            const highVal = document.createElement("td");
            const volVal = document.createElement("td");
            dateVal.innerHTML = stockListing.date;
            openVal.innerHTML = currencyFormat(stockListing.open);
            closeVal .innerHTML = currencyFormat(stockListing.close);
            lowVal.innerHTML = currencyFormat(stockListing.low);
            highVal.innerHTML = currencyFormat(stockListing.high);
            volVal.innerHTML = parseInt(stockListing.volume);
            trStockRow.appendChild(dateVal);
            trStockRow.appendChild(openVal);
            trStockRow.appendChild(closeVal);
            trStockRow.appendChild(lowVal);
            trStockRow.appendChild(highVal);
            trStockRow.appendChild(volVal);
            tbl.appendChild(trStockRow);
        }
        stockDiv.appendChild(tbl);
    }

    //creates the stock information header
    function stockHeader() {
        const trHeader = document.createElement("tr");
        const dateHeader = document.createElement("th");
        const openHeader = document.createElement("th");
        const closeHeader = document.createElement("th");
        const lowHeader = document.createElement("th");
        const highHeader = document.createElement("th");
        const volHeader = document.createElement("th");
        dateHeader.innerHTML = "Date";
        openHeader.innerHTML = "Open";
        closeHeader .innerHTML = "Close";
        lowHeader.innerHTML = "Low";
        highHeader.innerHTML = "High";
        volHeader.innerHTML = "Volume";
        trHeader.appendChild(dateHeader);
        trHeader.appendChild(openHeader);
        trHeader.appendChild(closeHeader);
        trHeader.appendChild(lowHeader);
        trHeader.appendChild(highHeader);
        trHeader.appendChild(volHeader);
        return trHeader;
    }

    //toggles the alternative chart view
    function toggleChartView(selectedCompany) {
        if (selectedCompany == null){
            alert("Please select a company before switching to chart view");
        }
        else {
            const main = document.querySelector("#mainView");
            const chart = document.querySelector("#chartView");
                if (main.classList.contains("showSection") &&   chart.classList.contains("hideSection")) {
                    main.classList.remove("showSection");
                    main.classList.add("hideSection");
                    chart.classList.remove("hideSection");
                    chart.classList.add("showSection");
                }
                else {
                    main.classList.remove("hideSection");
                    main.classList.add("showSection");
                    chart.classList.remove("showSection");
                    chart.classList.add("hideSection");
                }
        }
    }

    // inspired by https://stackoverflow.com/questions/28180871/grouped-bar-charts-in-chart-js   
    //creates bar chart
    function createBarChart(company){
         document.querySelector('#bar-div').innerHTML = "";
        if(company != null && company.financials == null){
            const h3 = document.createElement('h3');
            h3.textContent = "No financial information to be displayed for bar chart";
            h3.setAttribute("id", "noFinancialMessage");
            document.querySelector('#bar-div').appendChild(h3);
            
        }
        else{
        
        const bar = document.createElement('canvas');
        bar.setAttribute("id", "bar-graph-img");
        
        document.querySelector('#bar-div').appendChild(bar);
        
        const barGraphSection = document.querySelector('#bar-graph-img').getContext("2d");
        
        let barData = {
            labels: [2017,2018,2019],
            datasets: [
                {   
                    label: "Revenue",
                    backgroundColor: "blue",
                    data: company.financials.revenue
                },
                {
                    label: "Earnings",
                    backgroundColor: "red",
                    data: company.financials.earnings
                },
                {
                    label: "Assets",
                    backgroundColor: "green",
                    data: company.financials.assets
                },
                {
                    label: "Liabilities",
                    backgroundColor: "Yellow",
                    data: company.financials.liabilites
                }
            ]
        };
        let barChartOptions = {
            responsive: true,
    maintainAspectRatio: false,
            legend: {
                position: "top"
            },
            title: {
                display: true,
                text: "Revenue, Earnings, Assets, and Liabilities"
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        // Include a dollar sign in the ticks
                    callback: function(value, index, values) {
                        return '$' + value;
                    }
                    }
                }]
            }
        }
        let BarChart = new Chart(barGraphSection, {
            type: "bar",
            data: barData,
            options: barChartOptions
        }); 
        }
    }

    // inspired by https://code.tutsplus.com/tutorials/getting-started-with-chartjs-line-and-bar-charts--cms-28384 
    //used https://stackoverflow.com/questions/51196855/chart-js-moment-js-could-not-be-found-you-must-include-it-before-chart-js-to for script help
    //creates line chart
    function createLineChart(stockData){
       document.querySelector('#line-div').innerHTML = "";
        
        if(stockData == null){
           const h3 = document.createElement('h3');
            h3.textContent = "No financial information to be displayed for line chart";
            h3.setAttribute("id", "noFinancialMessageLine");
            document.querySelector('#line-div').appendChild(h3); 
        }
        else{
        const bar = document.createElement('canvas');
        bar.setAttribute("id", "line-graph-img");
        
        document.querySelector('#line-div').appendChild(bar);
        const lineGraphSection = document.querySelector('#line-graph-img').getContext("2d");
        let dataClose = {
            label: "Close",
            data: [],
            lineTension: 0,
            fill: false,
            borderColor: 'blue'
            // Set More Options
        };
        let dataVolume = {
            label: "Volume per 100 000",
            data: [],
            lineTension: 0,
            fill: false,
            borderColor: 'red'
            // Set More Options
        };
                let closeVolumeData = {
            labels: [],
            datasets: [dataClose, dataVolume]
        };
        for(let entry of stockData){
            dataClose.data.push(entry.close);
            dataVolume.data.push(entry.volume/100000);
            closeVolumeData.labels.push(entry.date);
        }
        let lineChart = new Chart(lineGraphSection, {
            type: 'line',
            data: closeVolumeData,
            options: {
                 responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                        quarter: 'MMM YYYY'
                    }
                        },

                        ticks: {
                            
                            maxTicksLimit: 10,
                            source: "auto"
                        },

                    }],
                    yAxes: [{
                        ticks: {
                    // Include a dollar sign in the ticks
                    callback: function(value, index, values) {
                        return '$' + value;
                    }
        
                    }}]
                }
                                  }
        });
        }
    }
    
    //creates candle chart
    function createCandleChart(stockData){
        const candleGraphSection = document.querySelector('#candle-graph-img');
        let candlestickChart = echarts.init(candleGraphSection);
        let option = {
            xAxis: {
                data: ['Min', 'Max', 'Averag']
            },
            yAxis: {},
            series: [{
                type: 'k',
                data: [
                    [stockData[0].open, stockData[0].high, stockData[0].low, stockData[0].close],
                    [stockData[60].open, stockData[60].high, stockData[60].low, stockData[60].close],
                ]
            }]
        };   
        candlestickChart.setOption(option);
    }        
        
    //general sorting function for each one of the header types of the stock table
    function sortStocks(sortType) {
        if (sortType == "Date") {
            const dateSort = stockData.sort( function(a,b) {
                if (a.date > b.date) {
                    return -1;
                }
                else if (a.date < b.date) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            popStockData(dateSort);
        }
        else if (sortType == "Open") {
            const openSort = stockData.sort( function(a,b) {
                if (parseFloat(a.open) > parseFloat(b.open)) {
                    return -1;
                }
                else if (parseFloat(a.open) < parseFloat(b.open)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            popStockData(openSort);
        }
        else if (sortType == "Close") {
            const closeSort = stockData.sort( function(a,b) {
                if (parseFloat(a.close) > parseFloat(b.close)) {
                    return -1;
                }
                else if (parseFloat(a.close) < parseFloat(b.close)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            popStockData(closeSort);
        }
        else if (sortType == "Low") {
            const lowSort = stockData.sort( function(a,b) {
                if (parseFloat(a.low) > parseFloat(b.low)) {
                    return -1;
                }
                else if (parseFloat(a.low) < parseFloat(b.low)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            popStockData(lowSort);
        }
        else if (sortType == "High") {
            const highSort = stockData.sort( function(a,b) {
                if (parseFloat(a.high) > parseFloat(b.high)) {
                    return -1;
                }
                else if (parseFloat(a.high) < parseFloat(b.high)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            popStockData(highSort);
        }
        else if (sortType == "Volume") {
            const volSort = stockData.sort( function(a,b) {
                if (parseFloat(a.volume) > parseFloat(b.volume)) {
                    return -1;
                }
                else if (parseFloat(a.volume) < parseFloat(b.volume)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            popStockData(volSort);
        }
    }

    //populates the secondary area of the stock table
    function popStockSecondary(sD) {
        stockDivSecondary.innerHTML = "";
        let secondaryArray = [
            ["open", generateValArray(sD, "open")], 
            ["close", generateValArray(sD, "close")], 
            ["low", generateValArray(sD, "low")], 
            ["high", generateValArray(sD, "high")], 
            ["volume", generateValArray(sD, "volume")]
        ];
        let tblArray = [];
        for (ar of secondaryArray) {
            const colName = ar[0];
            const mMA = genMinMaxAvg(ar[1]);
            const min = mMA[0];
            const max = mMA[1];
            const avg = mMA[2];
            tblArray.push([mMA[0], mMA[1], mMA[2]]);
        }
        tblArray = tableFlip(tblArray);
        const tbl = document.createElement("table");
        const headerRow = document.createElement("tr");
        const openHeader = document.createElement("th");
        const closeHeader = document.createElement("th");
        const lowHeader = document.createElement("th");
        const highHeader = document.createElement("th");
        const volHeader = document.createElement("th");
        openHeader.innerHTML = "Open";
        closeHeader .innerHTML = "Close";
        lowHeader.innerHTML = "Low";
        highHeader.innerHTML = "High";
        volHeader.innerHTML = "Volume";
        headerRow.appendChild(openHeader);
        headerRow.appendChild(closeHeader);
        headerRow.appendChild(lowHeader);
        headerRow.appendChild(highHeader);
        headerRow.appendChild(volHeader);
        tbl.appendChild(headerRow);
        for (row of tblArray) {
            const rw = document.createElement("tr");
            const open = document.createElement("td"); 
            const close = document.createElement("td");
            const low = document.createElement("td");
            const high = document.createElement("td");
            const vol = document.createElement("td");
            open.textContent = currencyFormat(row[0]);
            close.textContent = currencyFormat(row[1]);
            low.textContent = currencyFormat(row[2]);
            high.textContent = currencyFormat(row[3]);
            vol.textContent = Math.round(row[4]);
            rw.appendChild(open);
            rw.appendChild(close);
            rw.appendChild(low);
            rw.appendChild(high);
            rw.appendChild(vol);
            tbl.appendChild(rw);
        }
        tbl.rows[0].insertCell(0);
        let minRow = tbl.rows[1].insertCell(0);
        minRow.innerHTML = "Minimum";
        let maxRow = tbl.rows[2].insertCell(0);
        maxRow.innerHTML = "Maximum";
        let avgRow = tbl.rows[3].insertCell(0);
        avgRow.innerHTML = "Average";
        stockDivSecondary.appendChild(tbl);
    }

    //generates an array of the given property, for example the volume column for an array of stock data
    function generateValArray(array, prop) {
        let returnArray = [];
        for (ele of array) {
            returnArray.push(ele[prop]);
        }
        return returnArray;
    }

    //generates the minimum, maximum, and average values for an array of values
    function genMinMaxAvg(valArray) {
        let sum = 0;
        for (v of valArray) {
            sum += parseFloat(v);
        }
        let avg = sum / valArray.length;
        // referred to https://medium.com/@vladbezden/how-to-get-min-or-max-of-an-array-in-javascript-1c264ec6e1aa for specific use information
        const retArray = [Math.min(...valArray), Math.max(...valArray), avg];
        return retArray;
    }

    //performs a table transposition
    function tableFlip(array) {
        const rowCount = array.length;
        const colCount = array[0].length;
        retArray = [[],[],[]];
        for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < colCount; col++) {
                retArray[col][row] = array[row][col];
            }
        }
        return retArray;
    }


    function changeCompanyAndSymbolHeader(selectedCompany){
        const headerCompanySymbol = document.querySelector("#CompanyName-Symbol");
        
        headerCompanySymbol.textContent = "";
        headerCompanySymbol.textContent = selectedCompany.name + " " + selectedCompany.symbol;                        
    }
    
    function companyDescription(selectedCompany){
        const companyDescription = document.querySelector('#company-description');
        companyDescription.textContent = selectedCompany.description;
        
    }

    //from lab08-test06
    function currencyFormat(num) {
        return new Intl.NumberFormat('en-us', {style: 'currency', currency: 'USD'}).format(num);
    }
});
