import asyncio


async def process_message(text: str) -> str:
    print(f"Processing message: {text}")
    await asyncio.sleep(1)
    return f"You sent '{text}'"

