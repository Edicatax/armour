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

document.getElementById('strength').addEventListener("change", (e) => {
  const equippedWeight = parseInt(document.getElementById('equippedweight').innerHTML);
  recalculateBurden(equippedWeight);
  updateUrl();
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

const updateUrl = () => {
  if (!history.replaceState) {
    // We don't have a way to replace history state
    return;
  }
  const baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;

  const str = parseInt(document.getElementById('strength').value);
  const equipmentRows = document.querySelectorAll('#equipped tbody > tr');
  let equipment = '';
  for (const row of equipmentRows) {
    equipment += row.childNodes[0].innerHTML.trim().toLowerCase() + ';';
  }
  const encodedEquipment = btoa(equipment);

  const parameters = '?str=' + str + '&equips=' + encodedEquipment;
  const newurl = baseUrl + parameters;
  // Replace the current history state with the new url
  window.history.replaceState({path:newurl},'',newurl);
}

const updateVurdere = (table, column) => {
  let total = 0;
  for (const row of table.childNodes) {
    const text = row.childNodes[column].innerHTML;
    total += parseInt(text.split(" ")[0]);
  }
  const header = document.querySelectorAll('#' + table.id + "head > tr")[0];
  header.childNodes[column - 2].innerHTML = total;
}

const roundWeight = (value) => {
  return +(Math.round(value+'e2')+'e-2');
}

const recalculateBurden = (carriedWeight) => {
  const str = parseInt(document.getElementById('strength').value);
  // Calculation from https://dwwiki.mooo.com/wiki/Burden
  const maxCapacity = roundWeight((((str * str) / 5) + str + 20) * 1.89);
  const unusedCapacity = roundWeight(maxCapacity - carriedWeight);
  const wornWeight = carriedWeight / 2;
  const burden = roundWeight((wornWeight / maxCapacity) * 100);
  document.getElementById('unusedcap').value = unusedCapacity + " Lbs";
  document.getElementById('burden').value = burden + "%";
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
  total = roundWeight(total);
  recalculateBurden(total);
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
  for (const row of rows) {
    const layersToCheck = row.childNodes[8].innerHTML.trim().split(" ");
    for (const layer of layersToCheck) {
      if (layers.indexOf(layer) == layers.lastIndexOf(layer)) {
        row.style.color = "#000";
        continue;
      }
      row.style.color = "#f00";
      break;
    }
  }
}

const updateTable = (table) => {
  const header = document.getElementById(table.id + "head");
  if(table.rows.length < 1) {
    table.style.display = "none";
    header.style.display = "none";
    return;
  }

  table.style.display = "";
  header.style.display = "";
  updateVurdere(table, 3);
  updateVurdere(table, 4);
  updateVurdere(table, 5);
}

const updateEquipment = () => {
  const table = document.getElementById("equipped");
  updateWeight(table);
  highlightDuplicates(table);
  updateUrl();
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
  const targetRow = targetTable.insertRow(-1);
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
      const table = tRow.closest('tbody');
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
  const equipmentHeader = document.getElementById('equipmentHeader').insertRow(-1);
  for (const csvValue of csvHeader) {
    const headerCell = equipmentHeader.insertCell(-1);
    headerCell.innerHTML = csvValue;
    if (shouldHideEquipmentCell(headerCell)) {
      headerCell.style.display = "none";
    }
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
  const weightCell = footer.insertCell(-1);
  weightCell.innerHTML = '0';
  weightCell.id = 'equippedweight';
  footer.insertCell(-1).colSpan = 3;
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

const setupUrlParameters = () => {
  const url = new URL(window.location.href);
  const str = url.searchParams.get('str') || 13;
  const equips = atob(url.searchParams.get('equips')).split(';');
  const armours = document.querySelectorAll('#armours tbody > tr');
  for (const row of armours) {
    const armourName = row.childNodes[0].innerHTML.trim().toLowerCase();
    if (equips.includes(armourName)) {
      equipRow({target:row.childNodes[0]});
    }
  }
  document.getElementById('strength').value = str;
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

  setupUrlParameters();
}

request();

