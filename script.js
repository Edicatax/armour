const csvUrl = "newarmours.csv";

document.getElementById('area-filter').addEventListener("change",(e) => {
  const selection = e.target.selectedOptions[0].value;
  const table = document.getElementById('armours');
  for (const row of table.querySelectorAll('tbody > tr')) {
    if (row.childNodes[9].innerHTML.toLowerCase().includes(selection) || selection === "-") {
      row.style.display = null;
      continue;
    }
    row.style.display = "none";
  }
});

const parseCsv = async ( strData, strDelimiter ) => {
  strDelimiter = (strDelimiter || ",");

  var objPattern = new RegExp(
    (
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );

  var arrData = [[]];
  var arrMatches = null;

  while (arrMatches = objPattern.exec( strData )){
    var strMatchedDelimiter = arrMatches[ 1 ];
    if (
      strMatchedDelimiter.length &&
      strMatchedDelimiter !== strDelimiter
    ){
      arrData.push( [] );
    }

    var strMatchedValue;
    if (arrMatches[ 2 ]){
      strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
      );
    } else {
      strMatchedValue = arrMatches[ 3 ];
    }
    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }
  return( arrData );
}

const updateVurdere = (table, column) => {
  let total = 0;
  for (const row of table.getElementsByTagName('tbody')[0].childNodes) {
    const text = row.childNodes[column].innerHTML;
    total += parseInt(text.split(" ")[0]);
  }
  table.querySelectorAll('tfoot > tr')[0].childNodes[column].innerHTML = total;
}

const updateWeight = (table) => {
  let total = 0;
  for (const row of table.getElementsByTagName('tbody')[0].childNodes) {
    const text = row.childNodes[1].innerHTML;
    const fraction = text.trim().split(" ");
    let whole = 0;
    let part = 0;
    if (fraction.length > 1) {
      const p = fraction[1].split("/");
      part = parseInt(p[0]) / parseInt(p[1]);
    }
    if (fraction[0].includes("/")) {
      const p = fraction[0].split("/");
      part = parseInt(p[0]) / parseInt(p[1]);
    } else {
      whole = parseInt(fraction[0]);
    }
    total += whole + part;
  }
  total = +(Math.round(total+'e2')+'e-2');
  total += " lbs";
  table.querySelectorAll('tfoot > tr')[0].childNodes[1].innerHTML = total;
}

const highlightDuplicates = (table) => {
  const rows = table.querySelectorAll('tbody > tr')
  const layers = [];
  for (const row of rows) {
    const newLayers = row.childNodes[8].innerHTML.trim().split(" ");
    layers.push(...newLayers);
  }
  console.log(layers);
  for (const row of rows) {
    const layersToCheck = row.childNodes[8].innerHTML.trim().split(" ");
    for (const layer of layersToCheck) {
      if (layers.indexOf(layer) == layers.lastIndexOf(layer)) {
        row.style.color = "#000";
        console.log('single');
        continue;
      }
      row.style.color = "#f00";
      console.log('duplicate');
      console.log(layer);
      break;
    }
  }
}

const updateTable = (table) => {
  if(table.rows.length < 3) {
    table.closest('div').style.display = "none";
    return;
  }

  table.closest('div').style.display = "block";
  updateVurdere(table, 3);
  updateVurdere(table, 4);
  updateVurdere(table, 5);
}

const updateEquipment = () => {
  const table = document.getElementById("equipped");
  updateWeight(table);
  highlightDuplicates(table);
}

const addRowToEquipment = (row) => {
  const cells = row.getElementsByTagName('td');
  const targetTable = document.getElementById("equipped");
  const targetRow = targetTable.querySelectorAll('tbody')[0].insertRow(-1);
  for (const cell of cells) {
    const equippedCell = targetRow.insertCell(-1);
    equippedCell.innerHTML = cell.innerHTML;
    if (shouldHideEquippedCell(equippedCell)) {
      equippedCell.style.display = "none";
    }
  }
  const unequipCell = targetRow.childNodes[22];
  unequipCell.style.display = "table";
  const unequipBox = unequipCell.firstChild;
  unequipBox.addEventListener('click', unequipRow);
  updateEquipment();
}

const addRowToTable = (row, tableName) => {
  const cells = row.getElementsByTagName('td');
  const targetTable = document.getElementById(tableName);
  const targetRow = targetTable.querySelectorAll('tbody')[0].insertRow(-1);
  for (const cell of cells) {
    const equippedCell = targetRow.insertCell(-1);
    equippedCell.innerHTML = cell.innerHTML;
    if (shouldHideEquipmentCell(equippedCell)) {
      equippedCell.style.display = "none";
    }
  }
  updateTable(targetTable);
}

const unequipRow = (e) => {
  const row = e.target.closest('tr');
  const equipName = row.childNodes[0].innerHTML;
  for (const tRow of document.getElementById('equipment').querySelectorAll('tbody > tr')) {
    const currentItem = tRow.childNodes[0].innerHTML;
    if (currentItem === equipName) {
      const table = tRow.closest('table');
      tRow.parentNode.removeChild(tRow);
      updateTable(table);
    }
  }
  row.parentNode.removeChild(row);
  updateEquipment();
}

const equipRow = (e) => {
  const row = e.target.closest('tr');
  const coverage = row.childNodes;
  for (let i = 10; i < coverage.length - 1; i++) {
    const area = coverage[i].innerHTML.toLowerCase().trim();
    if (area === '') {
      continue;
    }
    addRowToTable(row, area);
  }
  addRowToEquipment(row);
}

const setupEquipmentTables = (csvHeader) => {
  for (const table of document.getElementById("equipment").getElementsByTagName('table')) {
    const header = table.createTHead().insertRow(-1);
    for (const csvValue of csvHeader) {
      const headerCell = header.insertCell(-1);
      headerCell.innerHTML = csvValue;
      if (shouldHideEquipmentCell(headerCell)) {
        headerCell.style.display = "none";
      }
    }
    const footer = table.createTFoot().insertRow(-1);
    footer.insertCell(-1).innerHTML = 'Total';
    footer.insertCell(-1);
    footer.insertCell(-1).style.display = "none";
    footer.insertCell(-1).innerHTML = '0';
    footer.insertCell(-1).innerHTML = '0';
    footer.insertCell(-1).innerHTML = '0';
    footer.insertCell(-1);
    footer.insertCell(-1);
  }
  const table = document.getElementById("equipped");
  const header = table.createTHead().insertRow(-1);
  for (const csvValue of csvHeader) {
    const headerCell = header.insertCell(-1);
    headerCell.innerHTML = csvValue;
    if (shouldHideEquippedCell(headerCell)) {
      headerCell.style.display = "none";
    }
  }
  header.insertCell(-1).innerHTML = 'Unequip';
  const footer = table.createTFoot().insertRow(-1);
  footer.insertCell(-1).innerHTML = 'Total';
  footer.insertCell(-1).innerHTML = '0';
  footer.insertCell(-1);
  footer.insertCell(-1);
  footer.insertCell(-1);
}
const shouldHideEquippedCell = (cell) => {
  return cell.cellIndex > 9 || ( cell.cellIndex > 1 && cell.cellIndex < 8 );
}

const shouldHideEquipmentCell = (cell) => {
  return cell.cellIndex > 7 || cell.cellIndex === 1;
}

const shouldHideArmourCell = (cell) => {
  return cell.cellIndex > 9;
}

const request = async () => {
  const response = await fetch(csvUrl);
  const csv = await response.text();
  const csvArray = await parseCsv(csv,';');
  const csvHeader = csvArray.shift();

  setupEquipmentTables(csvHeader);

  const table = document.getElementById("armours");
  for (const csvRow of csvArray) {
    const row = table.insertRow(-1);
    for (const csvValue of csvRow) {
      const cell = row.insertCell(-1);
      cell.innerHTML = csvValue;
      if (shouldHideArmourCell(cell)) {
        cell.style.display = "none";
      }
    }
    row.insertCell(-1).innerHTML = '<button class="equip">x</button>';
  }
  const header = table.createTHead().insertRow(-1);
  for (const csvValue of csvHeader) {
    const cell = header.insertCell(-1);
    cell.innerHTML = csvValue;
    if (shouldHideArmourCell(cell)) {
      cell.style.display = "none";
    }
  }
  header.insertCell(-1).innerHTML = 'Equip';

  for (const node of document.querySelectorAll('.equip')) {
    node.addEventListener('click', equipRow);
  }
}

request();

