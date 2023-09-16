
function preventNonNumericInput(event) {
    var charCode = event.which ? event.which : event.keyCode;

    if (charCode !== 8 && (charCode < 48 || charCode > 57) && charCode !== 46)
    {
        event.preventDefault();
    }
}

// Обработчик события click для скрытия контекстного меню
document.addEventListener("click", function (event)
{
    var contextMenu = document.getElementById("contextMenu");

    if (!event.target.closest(".context-menu"))
    {
        contextMenu.style.display = "none";
    }
});

// Добавляем функцию удаления строки
function deleteRow(event)
{
    var contextMenu = document.getElementById("contextMenu");
    var rowIndex = contextMenu.dataset.rowIndex;
    var table = document.getElementById("myTable");

    if (rowIndex && rowIndex > 0)
    {
        table.deleteRow(rowIndex);
    }
    contextMenu.style.display = "none";
}

function addRow() {
    var table = document.getElementById("myTable");
    var row = table.insertRow(-1); // Вставляем строку в конец таблицы (-1).
    var colCount = table.rows[0].cells.length; // Получаем количество столбцов в таблице.

    for (var i = 0; i < colCount; i++)
    {
        var cell = row.insertCell(i);
        cell.innerHTML = ""; // Значение по умолчанию - "0".
        cell.setAttribute("contenteditable", "true"); // Делаем ячейку редактируемой.
        cell.addEventListener("keydown", preventNonNumericInput);
    }
}

let notificationCounter = 0;

function showNotification(text)
{
    var notification = document.createElement('div');
    notification.classList.add('notification');
    notification.id = 'notification-' + notificationCounter;
    notification.onclick = function()
    {
        hideNotification(notification.id);
    };

    notification.innerHTML = '<div>' + text + '</div>';
    document.body.appendChild(notification);

    setTimeout(function() {
        notification.classList.add('show');
    }, 0);

    setTimeout(function() {
        hideNotification(notification.id);
    }, 4000);

    notificationCounter++;
}

function hideNotification(notificationId) {
    var notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');

        setTimeout(function() {
            notification.remove();
        }, 1000);
    }
}

function help()
{
    let helpPanel = document.getElementById("helpPanel");
    let backdrop = document.getElementById("backdrop");
    backdrop.style.display = "block";
    helpPanel.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeHelpPanel()
{
    let helpPanel = document.getElementById("helpPanel");
    var backdrop = document.getElementById("backdrop");
    backdrop.style.display = "none";
    helpPanel.style.display = "none";
    document.body.style.overflow = "auto"; // Restore scrolling
}

function start()
{
    const content = GetContent();

    if(content === "") return;

    const startEvent = new CustomEvent('startEvent', { detail: content });
    document.dispatchEvent(startEvent);
}

function stop()
{
    const startEvent = new CustomEvent('stopEvent');
    document.dispatchEvent(startEvent);
}

document.addEventListener("DOMContentLoaded", function()
{
    help();

    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

    document.getElementById("myTable").addEventListener("contextmenu", function (event) {
        event.preventDefault(); // Предотвращаем стандартное контекстное меню браузера
        var contextMenu = document.getElementById("contextMenu");
        contextMenu.style.display = "block";
        contextMenu.style.left = event.clientX + "px";
        contextMenu.style.top = event.clientY + "px";

        // Определение, на какую строку был сделан щелчок
        var targetRow = event.target.closest("tr");

        if (targetRow && targetRow !== this.rows[0])
        {
            contextMenu.dataset.rowIndex = targetRow.rowIndex;
        }
    });

    document.addEventListener('startEvent', function(event)
    {
        let content = event.detail;
        console.log('startEvent', content);
        sendData("startButton", content);
        showNotification("Started");

    });

    document.addEventListener('stopEvent', function(event)
    {
        console.log('stopEvent');
        sendData("stopButton", null);
        showNotification("Stopped");
    });

    document.addEventListener("keydown", function (event) {
        const table = document.getElementById("myTable");
        const focusedCell = document.activeElement;

        if (event.key === "ArrowUp") {
            moveFocus(table, focusedCell, -1, 0);
        } else if (event.key === "ArrowDown") {
            moveFocus(table, focusedCell, 1, 0);
        } else if (event.key === "ArrowLeft") {
            moveFocus(table, focusedCell, 0, -1);
        } else if (event.key === "ArrowRight") {
            moveFocus(table, focusedCell, 0, 1);
        }
    });

    document.getElementById("myTable").addEventListener("keyup", function (event) {
        var target = event.target;

        // Проверяем, что событие произошло внутри редактируемой ячейки и клавиша - "Enter"
        if (target.contentEditable === "true" && event.key === "Enter") {
            var row = target.parentElement;
            var cellIndex = target.cellIndex;
            var nextCell = getNextCellInRow(row, cellIndex);

            if (nextCell) {
                nextCell.focus();
            } else {
                moveFocusToNextRow(row);
            }
        }
    });
});

function moveFocus(table, focusedCell, rowDelta, colDelta) {
        const rowIndex = focusedCell.parentElement.rowIndex;
        const cellIndex = focusedCell.cellIndex;
        const newRow = table.rows[rowIndex + rowDelta];
        const newCell = newRow ? newRow.cells[cellIndex + colDelta] : null;

        if (newCell) {
            newCell.focus();
        }
    }

function getNextCellInRow(row, cellIndex) {
    return row.cells[cellIndex + 1];
}

function moveFocusToNextRow(currentRow) {
    var table = currentRow.parentElement;
    var rowIndex = currentRow.rowIndex;
    var nextRow = table.rows[rowIndex + 1];

    if (nextRow) {
        var firstCellInNextRow = nextRow.cells[0];
        firstCellInNextRow.focus();
    }
}

function sendData(command, data) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/" + command, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("data=" + data);
}

let confirmationFunction = null;

function confirmImport()
{
    var confirmationPanel = document.getElementById("confirmationPanel");
    if (confirmationPanel.style.display === "block")
    {
        closeConfirmationPanel();
    }

    importFromFile();
}


function importFromFile()
{
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
}


function handleFileSelect(event)
{
    const file = event.target.files[0];

    if (file)
    {
        const reader = new FileReader();
        reader.onload = function (e)
        {
            const contents = e.target.result;
            updateTableFromText(contents);
        };
        reader.readAsText(file);
    }

    document.getElementById('fileInput').value = '';
}

function updateTableFromText(text)
{
    clear();

    const table = document.getElementById('myTable');
    const rows = text.trim().split(';'); // Разделяем текст на строки

    // Пропускаем первую строку (заголовок таблицы)
    for (let i = 0; i < rows.length; i++)
    {
        const rowText = rows[i];
        let rowIndex = i + 1;

        if(rowText.includes("!")) break;

        addRow();
        const cells = rowText.split(','); // Разделяем строку на ячейки

        for (let j = 0; j < cells.length; j++)
        {
            let cellText = cells[j];
            let cell = table.rows[rowIndex].cells[j];

            let parsedText = parseInt(cellText, 10);

            if(isNaN(parsedText))
            {
                showNotification("Error!! There is a non-numeric element detected in the file you are importing.");
                clear();
                return;
            }

            cell.textContent = cellText;
        }
    }

    showNotification("Successfully imported");
}

function importTable()
{
    confirmationFunction = confirmImport;

    if (document.getElementById("myTable").rows.length > 1)
    {
        openConfirmationPanel("Are you sure you want to import new table?");
    }
    else
    {
        confirmationFunction();
    }
}

function confirmClearTable()
{
    var confirmationPanel = document.getElementById("confirmationPanel");
    if (confirmationPanel.style.display === "block")
    {
        closeConfirmationPanel();
    }

    clear();
    showNotification("Table cleared");
}

function clear()
{
    const table = document.getElementById("myTable");

    for (let i = table.rows.length - 1; i > 0; i--)
    {
        table.deleteRow(i);
    }
}

function clearTable()
{
    confirmationFunction = confirmClearTable;

    if (document.getElementById("myTable").rows.length > 1)
    {
        openConfirmationPanel("Are you sure you want to clear the table?");
    }
    else
    {
        confirmationFunction();
    }
}

function OnConfirm()
{
    confirmationFunction();
}

function openConfirmationPanel(message)
{
    var backdrop = document.getElementById("backdrop");
    var confirmationPanel = document.getElementById("confirmationPanel");
    var confirmationMessage = document.getElementById("confirmationMessage");
    backdrop.style.display = "block";
    confirmationMessage.textContent = message;
    confirmationPanel.style.display = "block";
}

function closeConfirmationPanel()
{
    var backdrop = document.getElementById("backdrop");
    var confirmationPanel = document.getElementById("confirmationPanel");
    backdrop.style.display = "none";
    confirmationPanel.style.display = "none";
}


function exportTable()
{
    let content = GetContent();

    if(content === "") return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table_data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showNotification("Data saved");
}

function GetContent()
{
    let invalidCells = [];

    const table = document.getElementById('myTable');
    let content = '';

    if(table.rows.length <= 1) return "";

    validateTable(invalidCells);

    if (invalidCells.length > 0)
    {
        showErrors("Please correct the highlighted cells.", invalidCells);
        return "";
    }

    for (let i = 1; i < table.rows.length; i++)
    {
        const row = table.rows[i];
        const countOfCells = countNonEmptyCells(row);

        for (let j = 0; j < countOfCells; j++)
        {
            let cellElement = row.cells[j];
            let cellValue;

            cellValue = cellElement.textContent.trim();
            content += cellValue;

            if (j !== countOfCells - 1 && cellValue !== "")
            {
                content += ',';
            }
        }

        if (i !== table.rows.length - 1)
        {
            content += ';\n';
        }
        else
        {
            content += ';!';
        }
    }

    return content;
}

function validateTable(invalidCells)
{
    invalidCells.length = 0;

    const table = document.getElementById('myTable');
    for (let i = 1; i < table.rows.length; i++)
    {
        const row = table.rows[i];

        for (let j = 0; j < 5; j++)
        {
            let cellElement = row.cells[j];
            let cellData;

            if(j === 2)
            {
                cellData = cellElement.textContent.trim();

                let firstElement = row.cells[0].textContent.trim();
                let firstIntegerValue = parseInt(firstElement, 10);
                let currentIntegerValue = parseInt(cellData, 10);

                if(currentIntegerValue > firstIntegerValue)
                {
                    invalidCells.push({row: i, cell: j});
                }
            }
            else
            {
                cellData = cellElement.textContent.trim();
            }

            if (cellData === "")
            {
                invalidCells.push({row: i, cell: j});
            }
        }

        let content5 = row.cells[5].textContent.trim();
        let content6 = row.cells[6].textContent.trim();
        let content7 = row.cells[7].textContent.trim();

        if (content5 !== "" || content6 !== "" || content7 !== "")
        {
            if(content5 === "") invalidCells.push({row: i, cell: 5});
            if(content6 === "") invalidCells.push({row: i, cell: 6});
            if(content7 === "") invalidCells.push({row: i, cell: 7});
        }
    }
}

function countNonEmptyCells(row)
{
    let count = 0;

    for (let j = 0; j < row.cells.length; j++)
    {
        let cellElement = row.cells[j];
        let cellData;

        cellData = cellElement.textContent.trim();

        if (cellData !== "")
        {
            count++;
        }
    }

    return count;
}

function showErrors(message, invalidCells)
{
    openErrorPanel(message);

    const table = document.getElementById("myTable");
    for (const cellInfo of invalidCells) {
        const row = cellInfo.row;
        const cellIndex = cellInfo.cell;
        const rowElement = table.rows[row];
        const cellElement = rowElement.cells[cellIndex];

        cellElement.classList.add("invalid-cell");
    }

    setTimeout(function () {
        for (const cellInfo of invalidCells) {
            const row = cellInfo.row;
            const cellIndex = cellInfo.cell;
            const rowElement = table.rows[row];
            const cellElement = rowElement.cells[cellIndex];

            cellElement.classList.add("fade-out");

            setTimeout(function () {
                cellElement.classList.remove("invalid-cell", "fade-out");
            }, 3000); // Удалить классы через 8 секунд
        }
    }, 3000); // Добавить класс "fade-out" через 100 миллисекунд после добавления "invalid-cell"
}

function openErrorPanel(message) {
    const errorPanel = document.getElementById('errorPanel');
    const errorMessage = document.getElementById('errorMessage');
    const backdrop = document.getElementById('backdrop');

    backdrop.style.display = 'block';
    errorMessage.textContent = message;
    errorPanel.style.display = 'block';
}

function closeErrorPanel() {
    const errorPanel = document.getElementById('errorPanel');
    const backdrop = document.getElementById('backdrop');
    const errorCells = document.querySelectorAll('.error-cell');

    errorCells.forEach(cell => cell.classList.remove('error-cell'));
    backdrop.style.display = 'none';
    errorPanel.style.display = 'none';
}