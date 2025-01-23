const express = require("express");
const expressWs = require("express-ws");
const bodyParser = require("body-parser");
const uuidv4 = require("uuid").v4;

const app = express();

expressWs(app);
app.use(bodyParser.json());

const users = [];
const chats = {};
const clients = new Set();

app.post("/userauth", (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).send("Username is required");
    return;
  }

  const accessToken = uuidv4();
  users.push({ username, accessToken });
  res.status(200).json({ accessToken });
});

app.ws("/chat", (ws) => {
  let currentUser = null;
  clients.add(ws);

  ws.on("message", (message) => {
    try {
      const command = JSON.parse(message);

      if (!currentUser && command.type !== "auth") {
        ws.send(
          JSON.stringify({ type: "error", error: "Authentication required" })
        );
        return;
      }

      switch (command.type) {
        case "auth":
          const user = users.find((u) => u.accessToken === command.accessToken);
          if (user) {
            currentUser = user;
            if (!chats[currentUser.username]) {
              chats[currentUser.username] = [];
            }
            ws.send(
              JSON.stringify({
                type: "info",
                info: "Authenticated successfully",
              })
            );
          } else {
            ws.send(
              JSON.stringify({ type: "error", error: "Invalid access token" })
            );
          }
          break;

        case "message":
          const newMessage = {
            userId: currentUser.accessToken,
            username: currentUser.username,
            text: command.text,
          };

          if (!chats[currentUser.username]) {
            chats[currentUser.username] = [];
          }
          chats[currentUser.username].push(newMessage);

          clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({ type: "new_message", message: newMessage })
              );
            }
          });

          const delay = Math.floor(Math.random() * (10000 - 4000 + 1)) + 4000;
          setTimeout(() => {
            const fishMessages = [
              "Just keep swimming!",
              "I'm hooked on this conversation!",
              "You're fintastic!",
              "Water you talking about?",
              "I'm feeling a bit shellfish today.",
              "Let minnow if you need anything!",
              "This is off the scales!",
              "I'm having a whale of a time!",
              "You krill me!",
              "I'm not squidding!",
              "You're shrimply the best!",
              "I'm feeling a bit gill-ty!",
              "I'm a little crabby today!",
              "I'm dolphinitely excited!",
              "I'm feeling a bit eel-ated!",
              "I'm a bit of a clownfish!",
              "I'm feeling a bit koi!",
              "I'm a bit of a starfish!",
              "I'm feeling a bit fishy!",
              "I'm a bit of a guppy!",
            ];
            const fishMessage = {
              userId: "fishGPT",
              username: "fishGPT",
              text: fishMessages[
                Math.floor(Math.random() * fishMessages.length)
              ],
            };

            chats[currentUser.username].push(fishMessage);
            clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(
                  JSON.stringify({ type: "new_message", message: fishMessage })
                );
              }
            });
          }, delay);
          break;

        default:
          ws.send(
            JSON.stringify({ type: "error", error: "Unknown command type" })
          );
          break;
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", error: e.toString() }));
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Chat connection closed");
  });
});

app.listen(3000, () => {
  console.log("Server is running");
});
