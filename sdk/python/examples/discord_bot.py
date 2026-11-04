"""A Discord bot that only runs while its license is valid."""
import os
import sys

import discord
from discord.ext import commands

from shieldauth import ShieldAuth

shield = ShieldAuth(
    os.environ["SHIELDAUTH_APP_ID"],
    api_url=os.environ["SHIELDAUTH_API_URL"],
    public_key=os.environ["SHIELDAUTH_PUBLIC_KEY"],
)
if not shield.validate(os.environ["LICENSE_KEY"]):
    sys.exit(f"Not licensed: {shield.last_message}")

bot = commands.Bot(command_prefix="!", intents=discord.Intents.default())


@bot.event
async def on_ready():
    print(f"Ready as {bot.user}")


@bot.command()
async def ping(ctx):
    await ctx.send("Pong!")


shield.start_heartbeat()  # exits the process if the license is revoked
bot.run(os.environ["DISCORD_TOKEN"])
