document.addEventListener("DOMContentLoaded", function () {
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    let WIT_ACCESS_TOKEN = "";  // Se cargará desde el backend

    if (!chatBody || !chatInput || !sendBtn) {
        console.error("No se encontraron los elementos del chatbot.");
        return;
    }

    async function fetchAccessToken() {
        const response = await fetch("http://localhost:3000/get_wit_token");
        const data = await response.json();
        WIT_ACCESS_TOKEN = data.token;
    }

    async function getBotResponse(message) {
        if (!WIT_ACCESS_TOKEN) await fetchAccessToken();

        const API_URL = `https://api.wit.ai/message?v=20230101&q=${encodeURIComponent(message)}`;
        const response = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${WIT_ACCESS_TOKEN}` }
        });
        const data = await response.json();
        console.log(data);

        if (data.intents.length > 0) {
            const intent = data.intents[0].name;
            if (intent === "saludo") return "¡Hola! ¿En qué puedo ayudarte?";
            if (intent === "buscar_producto_barato") return "Aquí tienes una lista de productos baratos en nuestra web 🛒";
            if (intent === "consulta_precio") return "Puedes comparar precios en nuestra plataforma 📊.";
            if (intent === "comparar_precios") return "Te ayudo a comparar precios 📈. Dime qué producto buscas.";
        }

        return "No entendí eso 🤖. ¿Puedes reformular la pregunta?";
    }

    sendBtn.addEventListener("click", async function () {
        const userText = chatInput.value.trim();
        if (!userText) return;
        appendMessage(userText, "user");
        chatInput.value = "";

        const botResponse = await getBotResponse(userText);
        appendMessage(botResponse, "bot");
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement("div");
        msgDiv.textContent = text;
        msgDiv.style.padding = "5px";
        msgDiv.style.borderRadius = "5px";
        msgDiv.style.margin = "5px 0";
        msgDiv.style.background = sender === "bot" ? "#f1f1f1" : "#007bff";
        msgDiv.style.color = sender === "bot" ? "#000" : "#fff";
        msgDiv.style.textAlign = sender === "bot" ? "left" : "right";
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});
