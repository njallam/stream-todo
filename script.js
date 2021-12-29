const urlParams = new URLSearchParams(window.location.search);

const clientChannel = urlParams.get('channel');
if (!clientChannel) {
    document.getElementById('todos').innerHTML = "MISSING CHANNEL PARAMETER";
    throw new Error("Missing channel paramter");
}

const localStorageKey = `todos-${clientChannel}`;

const client = new tmi.Client({
    channels: [clientChannel]
});

let todos;
try {
    todos = JSON.parse(localStorage.getItem(localStorageKey));
    updateTodos();
} catch (error) {
    todos = {};
    console.warn(error);
}

const removeTodoRegex = new RegExp(/^!removetodo @?(\w+)/i)

client.connect().catch(console.error);

client.on('message', (channel, tags, message, self) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.startsWith('!todo ')) {
        const todo = message.substring(6);
        if (todo) {
            todos[tags['username']] = {color: tags['color'], todo};
            updateTodos();
        }
    } else if (lowerMessage === "!done" || lowerMessage.startsWith("!done ")) {
        removeTodo(tags['username']);
    } else if (tags['mod'] || tags["room-id"] === tags['user-id']) {
        if (lowerMessage === "!cleartodos" || lowerMessage.startsWith("!cleartodos ")) {
            clearTodos();
        } else if (match = removeTodoRegex.exec(message)) {
            removeTodo(match[1]);
        }
    }
});

client.on('clearchat', clearTodos);
client.on('ban', (channel,username,_,tags) => removeTodo(username));
client.on('timeout', (channel,username,_,duration,tags) => removeTodo(username));
client.on('messagedeleted', (channel,username,deletedMessage,tags) => removeTodo(username));

function clearTodos() {
    todos = {};
    updateTodos();
}

function removeTodo(username) {
    delete todos[username];
    updateTodos();
}

function updateTodos() {
    localStorage.setItem(localStorageKey, JSON.stringify(todos));
    document.getElementById('todos').innerHTML = '';
    Object.entries(todos).forEach(([k, v]) => {
        document.getElementById('todos').appendChild(makeTodoElement(k, v));
    });
}

function makeTodoElement(username, todo) {
    const user = document.createElement('span');
    user.style.color = todo.color;
    user.innerHTML = username;
    const todoElement = document.createElement('div');
    todoElement.innerHTML = ': ' + todo.todo;
    todoElement.prepend(user);
    return todoElement;
}
