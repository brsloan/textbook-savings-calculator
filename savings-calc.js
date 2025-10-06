var uploadBtn = document.getElementById('upload-csv-btn');
var itemCount = document.getElementById('number-items');
var searchInput = document.getElementById('search-input');
var addButton = document.getElementById('add-btn');

var dataHeaders = [];
var loadedTextbooks = [];
var addedTextbooks = [];

parseData(getSpring2025Data());
fillSelectList(loadedTextbooks);

searchInput.addEventListener('keyup', function(e){
    var filtered = loadedTextbooks.filter(function(val){
        return getTextSummary(val).includes(searchInput.value);
    });
    fillSelectList(filtered);
});

uploadBtn.onclick = function(e){
    uploadTextFile(function(csv){
        downloadTextFile(JSON.stringify(csv),'tempJSON.txt');
        parseData(csv);
        fillSelectList(loadedTextbooks);
    });
}

addButton.onclick = function(e){
    addSelected();
}

document.getElementById('search-results').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
        e.preventDefault();
        addSelected();
    }
});

document.getElementById('help').onclick = function(e){
    showHelp();
}

function showHelp(){
    var helpDiv = document.createElement('div');
    var helpText = document.createElement('p');
    helpText.innerText = "CSV file must have data in columns with headers SUBJECT, COURSE, BOOK_TITLE, AUTHOR, and COST TO STUDENTS, with SUBJECT being the short form ('ENGL') and COURSE being the number ('10100'). Headers do not have to be in upper case.";
    helpDiv.appendChild(helpText);
    document.getElementById('upload-panel').appendChild(helpDiv);
}

function addSelected(){
    var resultsList = document.getElementById('results-list');
    var selectedVals = Array.from(resultsList.selectedOptions).map(({ value }) => value)
    addTextbooks(selectedVals);
}

function addTextbooks(lineIds){
    const idIndex = dataHeaders.indexOf('LineID');

    lineIds.forEach(function(id){
        var matchingLine = loadedTextbooks.find(function(line){
            return line[idIndex] == id;
        })
        addedTextbooks.push(matchingLine);
    });

    fillAddedList(addedTextbooks);
}

function removeTextbook(id){
    const propIndexes = getPropertyIndexes();

    var matchIndex = addedTextbooks.findIndex(function(bk){
        return bk[propIndexes.idIndex] == id;
    });

    addedTextbooks.splice(matchIndex,1);
}

function fillAddedList(texts){
    const propIndexes = getPropertyIndexes();

    var textsTable = document.getElementById('added-textbooks-table');
    textsTable.innerHTML = '';

    var tblHeaders = ['','Course','Title','Savings'];

    var hdrRow = document.createElement('tr');
    tblHeaders.forEach(function(hdr){
        var thisHdr = document.createElement('th');
        thisHdr.innerText = hdr;
        hdrRow.appendChild(thisHdr);
    });
    textsTable.appendChild(hdrRow);


    texts.forEach(function(book){
        var bookRow = document.createElement('tr');

        var deleteCell = document.createElement('td');
        var deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'X';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = function(e){
            removeTextbook(book[propIndexes.idIndex]);
            fillAddedList(addedTextbooks);
        };
        deleteCell.appendChild(deleteBtn);
        bookRow.appendChild(deleteCell);

        var courseCell = document.createElement('td');
        courseCell.innerText = book[propIndexes.subjectIndex] + ' ' + book[propIndexes.courseIndex];
        bookRow.appendChild(courseCell); 

        var titleCell = document.createElement('td');
        titleCell.innerText = book[propIndexes.bookTitleIndex];
        bookRow.appendChild(titleCell);

        var savingsCell = document.createElement('td');
        savingsCell.innerText = book[propIndexes.costIndex];
        bookRow.appendChild(savingsCell);
        
        textsTable.appendChild(bookRow);
    });

    var totalSavings = 0;
    texts.forEach(function(book){
        var costText = book[propIndexes.costIndex];
        var costNumber = parseFloat(costText.replace('$','').replace(',',''));
        totalSavings += costNumber;
    });
    var totalRow = document.createElement('tr');
    totalRow.id = 'total-row';
    totalRow.appendChild(document.createElement('td'));
    totalRow.appendChild(document.createElement('td'));
    totalRow.appendChild(document.createElement('td'));
    var totalCell = document.createElement('td');
    totalCell.innerText = '$' + totalSavings.toFixed(2);
    totalRow.appendChild(totalCell);

    textsTable.appendChild(totalRow);

    document.getElementById('table-title').innerText = 'Textbook Savings: ' + '$' + totalSavings.toFixed(2);
}

function fillSelectList(texts){
    var resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    var resultsList = document.createElement('select');
    resultsList.id = 'results-list';
    resultsList.multiple = true;

    const idIndex = dataHeaders.indexOf('LineID');

    texts.forEach(function(book, i){
        var summary = getTextSummary(book);
        if(summary != ''){
            var thisOption = document.createElement('option');
            thisOption.value = book[idIndex];
            thisOption.innerText = summary;
            resultsList.appendChild(thisOption);
        }
    });

    resultsDiv.appendChild(resultsList);
}

function getTextSummary(book){
    var propIndexes = getPropertyIndexes();

    var response = '';

    if(book[propIndexes.subjectIndex] && book[propIndexes.subjectIndex] != ''){
       response = book[propIndexes.subjectIndex] + ' ' + book[propIndexes.courseIndex] + ': ' + book[propIndexes.bookTitleIndex] + ' by ' + book[propIndexes.authorIndex] + ' - ' + book[propIndexes.costIndex];
    }

    return response;
}

function getPropertyIndexes(){
    return {
        subjectIndex: dataHeaders.indexOf('SUBJECT'),
        courseIndex: dataHeaders.indexOf('COURSE'),
        bookTitleIndex: dataHeaders.indexOf('BOOK_TITLE'),
        authorIndex: dataHeaders.indexOf('AUTHOR'),
        costIndex: dataHeaders.indexOf('COST TO STUDENTS'),
        idIndex: dataHeaders.indexOf('LineID')
    }
}

function parseData(csv){
    var data = csvStringToArray(csv);
    dataHeaders = data.shift();
    dataHeaders.push('LineID');
    loadedTextbooks = removeDuplicates(data).sort();

    for(let i=0;i<loadedTextbooks.length;i++){
        loadedTextbooks[i].push(i);
    }

    itemCount.innerText = (data.length) + ' items loaded, ' + loadedTextbooks.length + ' unique values';

    return data;
}

function removeDuplicates(books){
    return uniqBy(books, getTextSummary);
}

function csvStringToArray(strData)
{
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"),"gi");
    let arrMatches = null, arrData = [[]];
    while (arrMatches = objPattern.exec(strData)){
        if (arrMatches[1].length && arrMatches[1] !== ",")arrData.push([]);
        arrData[arrData.length - 1].push(arrMatches[2] ? 
            arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"") :
            arrMatches[3]);
    }

    arrData = trimArrays(arrData);
    
    arrData[0] = arrData[0].map(function(val){
        return val.toUpperCase();
    });
    
    return arrData;
}

function trimArrays(arrs){
    arrs[0] = arrs[0].filter(function(val){
        return val != "";
    });

    for(i=1;i<arrs.length; i++){
        arrs[i] = arrs[i].slice(0,arrs[0].length);
    }

    return arrs;
}

function uploadTextFile(callback){
  var fileInput = document.createElement('input');
  fileInput.id = 'fileInput';
  fileInput.type = 'file';
  fileInput.accept = '.csv';

  fileInput.addEventListener('change', function(e){
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result);
    }

    if(file){
      reader.readAsText(file);
    }
  });

  fileInput.click();
}

function searchData(arrs, column, searchTerm){
   var colIndex = dataHeaders.indexOf(column);

   var results = arrs.filter(function(arr){
    return arr[colIndex] ? arr[colIndex].includes(searchTerm) : false;
   });

   return results;
}

function uniqBy(a, key) {
    var seen = {};
    return a.filter(function(item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
}

function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}