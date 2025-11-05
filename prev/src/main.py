import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

from src.agents.echo_agent import process_message

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            response = await process_message(data)
            await websocket.send_text(f"AI Agent says: {response}")
            
    except WebSocketDisconnect:
        print("Client disconnected")

@app.get("/")
def read_root():
    return {"Hello": "From AI Controller"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)

