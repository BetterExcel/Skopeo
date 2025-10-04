import asyncio


async def process_message(text: str) -> str:
    print(f"Processing message: {text}")
    return f"You sent '{text}'"

