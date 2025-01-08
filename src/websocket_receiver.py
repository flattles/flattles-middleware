import asyncio
import websockets

async def receive_message():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        message = await websocket.recv()
        print(message)

if __name__ == "__main__":
    asyncio.run(receive_message())