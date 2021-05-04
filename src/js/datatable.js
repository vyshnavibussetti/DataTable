const url = "https://restcountries.eu/rest/v2/all";

function DataTable(sortColumns, filterColumns, isHeaderFixed, pageLimits) {
  this.data = []; //To store the api response
  this.dataSize = 0; // Response data size;
  this.table_columns = ["Name", "Capital", "Region", "Population", "Area"];
  this.pageLimits = pageLimits; // To allow user to select page limit
  this.pageSize = pageLimits[0];
  this.pageNumbers = [];
  this.current = 1;
  this.next = 0;
  this.columnTypes = [
    {
      col_name: "Name",
      col_type: "String"
    },
    {
      col_name: "Capital",
      col_type: "String"
    },
    {
      col_name: "Region",
      col_type: "String"
    },
    {
      col_name: "Population",
      col_type: "Number"
    },
    {
      col_name: "Area",
      col_type: "Number"
    }
  ];
  this.filteredRows = []; //To display rows matching the filter text
  this.sortCodes = { asc: "&#8593", desc: "&#8595", default: "&#8597" };
  this.searchText = "";
  this.searchRows = []; //To display rows matching the search text
  this.columnsToSort = sortColumns; // To allow sort to only allowed columns
  this.columnsToFilter = filterColumns; // To allow sort filter to only allowed columns
}

//Init function to populate table along with other functionalities
DataTable.prototype.init = function () {
  this.getPages();
  this.getCountriesData(url);
  var that = this;
  document
    .getElementById("searchBox")
    .addEventListener("keyup", function (event) {
      event.preventDefault();
      that.searchTable(event);
    });
};

// To get the per page limits dropdown
DataTable.prototype.getPages = function () {
  var pagesDropDown = document.getElementById("pagesDropDown");
  this.pageLimits.forEach((element) => {
    var option = document.createElement("option");
    option.text = element;
    option.value = element;
    option.setAttribute("pageSize", element);
    pagesDropDown.add(option);
  });
  var that = this;
  document
    .getElementById("pagesDropDown")
    .addEventListener("change", function () {
      let value = document.getElementById("pagesDropDown").value;
      that.updatePageLimit(value);
    });
};

//To update the per page limit
DataTable.prototype.updatePageLimit = function (pageLimit) {
  this.pageSize = pageLimit;
  this.addPagination();
  this.displayPage(1);
};

//To search across the table
DataTable.prototype.searchTable = function (event) {
  event.preventDefault();
  let searchText = event.target.value.toLowerCase();
  this.searchText = searchText;
  let tbody = document.querySelector("tbody");
  let rows = tbody.querySelectorAll("tr");
  let rows_array = Array.from(rows);
  this.searchRows = [];
  rows_array.forEach((row) => {
    let searchExists = false;
    let cells = Array.from(row.getElementsByTagName("td"));

    cells.forEach((cell) => {
      if (cell.innerHTML.toLowerCase().includes(searchText)) {
        searchExists = true;
      }
    });

    if (searchExists === true) {
      row.style.display = "";
      this.searchRows.push(row);
    } else {
      row.style.display = "none";
    }
  });

  this.addPagination();
  this.displayPage(1);
};

// To fetch response from the api
DataTable.prototype.getCountriesData = async function (url) {
  const response = await fetch(url);
  let result = await response.json();
  this.data = result;
  this.dataSize = this.data.length;
  this.populateTable();
  this.addPagination();
  this.displayPage(1);
};

//To construct the table
DataTable.prototype.populateTable = function () {
  let table = `<thead><tr>`;
  for (let [index, value] of this.table_columns.entries()) {
    table += `<th class='tableHeader' id='colName' col_number="${index}" col_name="${value}" sort_direction="default" >`;
    table += `${value}`;

    if (this.columnsToSort.includes(value)) {
      table += `<span id='sortIcon' col_number="${index}" col_name="${value}" sort_direction="default" style="font-size: 20px; margin-right: 10px">&#8597;</span>`;
    }
    table += `</th>`;
  }
  table += `</tr>`;
  table += `<tr>`;
  for (let [index, value] of this.table_columns.entries()) {
    table += `<td id='colName' col_number="${index}" col_name="${value}"  >`;
    if (this.columnsToFilter.includes(value)) {
      table += `<input type='text' name='filterInput' id="${value}" col_number="${index}" col_name="${value}" />`;
    } else {
      table += `<input type='text' name='filterInput' disabled id="${value}" col_number="${index}" col_name="${value}" />`;
    }
    table += `</td>`;
  }
  table += `</tr>`;
  table += `</thead>`;
  table += `<tbody id='tbody' >`;
  for (let element of this.data) {
    table += `<tr> 
            <td col_name="name" col_number=0 >${element.name} </td>
            <td col_name="capital" col_number=1 >${element.capital}</td>
            <td col_name="region" col_number=2 >${element.region}</td> 
            <td col_name="population" col_number=3 >${element.population}</td>
            <td col_name="area" col_number=4 >${element.area}</td>          
        </tr>`;
  }

  table += `</tbody>`;
  document.getElementById("tableDiv").style.display = "";
  document.getElementById("data-table").innerHTML = table;
  document.getElementById("loadingDiv").style.display = "none";
  var cells = document.querySelectorAll("th");
  var that = this;
  for (let i = 0; i < cells.length; i++) {
    cells[i].addEventListener("click", function (event) {
      let colName = event.target.getAttribute("col_name");
      let colNumber = event.target.getAttribute("col_number");
      let currentDirection = event.target.getAttribute("sort_direction");
      let sortDirection;
      if (currentDirection === "default") {
        cells[i].setAttribute("sort_direction", "asc");
        sortDirection = "asc";
      } else if (currentDirection === "asc") {
        cells[i].setAttribute("sort_direction", "desc");
        sortDirection = "desc";
      } else if (currentDirection === "desc") {
        cells[i].setAttribute("sort_direction", "asc");
        sortDirection = "asc";
      }
      that.sortTable(colName, sortDirection, colNumber);
    });
  }

  var filterColumns = document.querySelectorAll("input[type=text]");
  filterColumns.forEach((filterColumn, index) => {
    filterColumns[index].addEventListener("keyup", function (event) {
      event.preventDefault();
      let colName = event.target.getAttribute("col_name");
      let value = event.target.value;
      let colNumber = event.target.getAttribute("col_number");
      that.filterData(colName, colNumber, value.toLowerCase());
    });
  });
};

//To sort the table
DataTable.prototype.sortTable = function (colName, sortDirection, colNumber) {
  var tbody = document.querySelector("tbody");
  var rows = tbody.querySelectorAll("tr");
  var rows_array = Array.from(rows);
  let columnType = this.columnTypes.find((element) => {
    return element.col_name === colName;
  }).col_type;

  let activeColumnFilters = this.getActiveFilterColumns(this.columnsToFilter);

  if (activeColumnFilters.length === 0) {
    this.sortByColName(rows_array, colNumber, columnType, sortDirection);
  } else {
    let filteredRows = this.filteredRows;
    this.sortByColName(filteredRows, colNumber, columnType, sortDirection);
  }
};

//Sort by column name
DataTable.prototype.sortByColName = function (
  arr,
  colNumber,
  colType,
  sortDirection
) {
  let sortedArr = arr.sort(function (a, b) {
    let aTextContent = a.querySelectorAll("td")[colNumber].innerHTML;
    let bTextContent = b.querySelectorAll("td")[colNumber].innerHTML;

    if (colType === "String") {
      if (sortDirection === "asc") {
        return aTextContent.localeCompare(bTextContent);
      } else if (sortDirection === "desc") {
        return bTextContent.localeCompare(aTextContent);
      }
    }

    if (colType === "Number") {
      if (sortDirection === "asc") {
        return aTextContent - bTextContent;
      } else if (sortDirection === "desc") {
        return bTextContent - aTextContent;
      }
    }
  });
  let tableHeaders = Array.from(document.querySelectorAll("th"));
  tableHeaders.filter((ele) => {
    if (this.columnsToSort.includes(ele.getAttribute("col_name"))) {
      ele.getElementsByTagName("span")[0].innerHTML = this.sortCodes["default"];
    }
  });

  let getIcon = document
    .querySelectorAll("th")
    [colNumber].querySelector("span");

  getIcon.innerHTML = this.sortCodes[sortDirection];

  let tbody = document.getElementById("tbody");
  sortedArr.forEach((row) => tbody.appendChild(row));
  this.displayPage(1);
};

// Filter columns by text
DataTable.prototype.filterData = function (colName, colNumber, filterText) {
  var tbody = document.querySelector("tbody");
  var rows = tbody.querySelectorAll("tr");
  var rows_array = Array.from(rows);
  this.filteredRows = [];
  rows_array.forEach((row) => {
    let innerText = row
      .getElementsByTagName("td")
      [parseInt(colNumber)].innerHTML.toLowerCase();
    if (innerText.includes(filterText)) {
      this.filteredRows.push(row);
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });

  rows_array.forEach((row) => tbody.appendChild(row));
  this.displayPage(1);
  this.addPagination();
};

// To display contents of a page
DataTable.prototype.displayPage = function (pageno) {
  let pageNumber = parseInt(pageno);
  let tableBody = document.getElementById("tbody");
  let tableRows = Array.from(tableBody.getElementsByTagName("tr"));

  let visibleRows = tableRows.filter((element) => element.style.display === "");
  let hiddenRows = tableRows.filter(
    (element) => element.style.display === "none"
  );

  let activeColumnFilters = this.getActiveFilterColumns(this.columnsToFilter);
  let rows;
  if (activeColumnFilters.length === 0 && this.searchText === "") {
    rows = tableRows;
  } else {
    rows = visibleRows;
  }

  let isFilterApplied = this.filteredRows.length === 0 ? false : true;
  rows.forEach((element) => (element.style.display = "none"));
  let start;

  if (pageNumber === 1) {
    start = 0;
  } else {
    let page = parseInt(pageNumber - 1);
    start = page * this.pageSize;
  }
  let end;
  if (activeColumnFilters.length === 0 && this.searchText === "") {
    end = parseInt(start) + parseInt(this.pageSize);
  } else {
    let diff;
    if (activeColumnFilters.length > 0) {
      diff = this.filteredRows.length - start;
    }

    if (this.searchText !== "") {
      diff = this.searchRows.length - start;
    }

    if (diff > this.pageSize) {
      end = parseInt(start) + parseInt(this.pageSize);
    } else {
      end = parseInt(start) + diff;
    }
  }

  let pageElements;
  pageElements = rows.slice(start, end);
  if (activeColumnFilters.length > 0) {
    pageElements = this.filteredRows.slice(start, end);
  }
  if (this.searchText !== "") {
    pageElements = this.searchRows.slice(start, end);
  }
  pageElements.forEach((element) => (element.style.display = ""));
  let innerHTML = "";
  if (pageNumber * this.pageSize <= this.dataSize) {
    if (activeColumnFilters.length > 0) {
      if (this.filteredRows.length === 0) {
        innerHTML = "No Results";
      } else {
        innerHTML = `Showing ${parseInt(start) + 1} to ${end} of 
        ${this.filteredRows.length}  entries (Filtered from  ${
          this.dataSize
        } entries )`;
      }
    } else if (this.searchText !== "") {
      if (this.searchRows.length === 0) {
        innerHTML = "No Results";
      } else {
        innerHTML = `Showing ${parseInt(start) + 1} to ${end} of 
        ${this.searchRows.length}  entries (Filtered from  ${
          this.dataSize
        } entries )`;
      }
    } else {
      innerHTML = `Showing ${parseInt(start) + 1} to ${end} of 
      ${this.dataSize} entries`;
    }
  } else {
    innerHTML = "";
  }
  document.getElementById("entries").innerHTML = innerHTML;
  this.current = pageNumber;
};

//To go to next page
DataTable.prototype.nextPage = function (event) {
  let nextPage = parseInt(this.current) + 1;
  if (nextPage >= this.pageNumbers) {
  } else {
    this.displayPage(nextPage);
  }
};

//To go to previous page
DataTable.prototype.previousPage = function (event) {
  let previousPage = parseInt(this.current) - 1;

  if (previousPage === 0) {
  } else {
    this.displayPage(previousPage);
  }
};

// To navigate across pages
DataTable.prototype.addPagination = function () {
  let pageSize = this.pageSize;
  // let dataSize = this.dataSize;
  let pageNumbers;
  let table_rows = document.getElementById("tbody").querySelectorAll("tr");

  let hiddenRows = Array.from(table_rows).filter(
    (element) => element.style.display === "none"
  );

  let activeColumnFilters = this.getActiveFilterColumns(this.columnsToFilter);
  let visibleRows;

  if (activeColumnFilters.length > 0) {
    visibleRows = this.filteredRows.length;
  }
  if (activeColumnFilters.length === 0 && this.searchText === "") {
    visibleRows = table_rows.length;
  } else {
    visibleRows = table_rows.length - hiddenRows.length;
  }

  pageNumbers =
    visibleRows % pageSize === 0
      ? Math.floor(visibleRows / pageSize)
      : Math.floor(visibleRows / pageSize) + 1;
  this.pageNumbers = pageNumbers;

  this.current = 1;
  this.lastPage = this.pageNumbers;
  let pagination = "";

  if (activeColumnFilters.length > 0) {
    pageNumbers = Math.ceil(this.filteredRows.length / this.pageSize);
  } else if (this.searchText !== "") {
    pageNumbers = Math.ceil(this.searchRows.length / this.pageSize);
  } else {
    pageNumbers = Math.ceil(this.dataSize / this.pageSize);
  }

  if (pageNumbers < 5) {
    for (let i = 0; i < pageNumbers; i++) {
      pagination += ` <a pageNumber='${i + 1}'> ` + parseInt(i + 1) + `</a>`;
    }
  } else {
    if (pageNumbers > 5) {
      pagination += `<button id="previous" >Previous</button>`;
    }
    for (let i = 1; i <= 5; i++) {
      pagination += `<a pageNumber='${i}' >` + parseInt(i) + `</a>`;
    }

    if (pageNumbers > 5) {
      pagination += `<a style="pointer-events: none">...</a>`;
      pagination +=
        `<a pageNumber='${pageNumbers}' >` + parseInt(pageNumbers) + `</a>`;
      pagination += `<button id="next" >Next</button>`;
    }
  }
  document.getElementById("pagination").innerHTML = "";
  document.getElementById("pagination").innerHTML = pagination;

  let pages = document.getElementById("pagination").querySelectorAll("a");
  var that = this;
  pages.forEach((element, index) => {
    let pageNumber = element.getAttribute("pageNumber");
    pages[index].addEventListener("click", function () {
      that.displayPage(pageNumber);
    });
  });

  if (pageNumbers > 5) {
    document.getElementById("next").addEventListener("click", function (event) {
      that.nextPage(event);
    });

    document
      .getElementById("previous")
      .addEventListener("click", function (event) {
        that.previousPage(event);
      });
  }
};

//To get columns with filters
DataTable.prototype.getActiveFilterColumns = (columnsToFilter) => {
  let thead = document.querySelector("thead");
  let secondHeaders = thead.getElementsByTagName("tr")[1];
  let filterElements = Array.from(secondHeaders.getElementsByTagName("td"));
  let columns = columnsToFilter;
  let colFilters = filterElements.map((element, index) => {
    let input = element.querySelector("input[type='text']");

    if (columns.includes(element.getAttribute("col_name"))) {
      if (input.value !== "") {
        return {
          colName: element.getAttribute("col_name"),
          colNumber: element.getAttribute("col_number"),
          value: element.value
        };
      }
    }
  });
  let activeColumnFilters = colFilters.filter((ele) => ele !== undefined);
  return activeColumnFilters;
};

let sortableColumns = ["Name", "Capital", "Region", "Population", "Area"];
let filterColumns = ["Name", "Capital", "Region"];
let isHeaderFixed = true;
let pageSizes = [10, 25, 50];
var newData = new DataTable(
  sortableColumns,
  filterColumns,
  isHeaderFixed,
  pageSizes
);
newData.init();
