import discord
from discord.ext import commands, tasks
from shieldauth import ShieldAuth

# Initialize ShieldAuth
auth = ShieldAuth("YOUR_APP_ID")

# Validate license on startup
LICENSE_KEY = "YOUR_LICENSE_KEY"  # Or load from config
if not auth.validate(LICENSE_KEY):
    print("Invalid license! Bot will not start.")
    exit(1)

print("License valid! Starting bot...")

# Create bot
bot = commands.Bot(command_prefix="!")

@bot.event
async def on_ready():
    print(f"Bot ready as {bot.user}")
    heartbeat_task.start()

@tasks.loop(minutes=5)
async def heartbeat_task():
    """Send heartbeat every 5 minutes"""
    if auth.heartbeat():
        print("Heartbeat sent")
    else:
        print("Heartbeat failed! Shutting down...")
        await bot.close()

@bot.command()
async def ping(ctx):
    await ctx.send("Pong!")

bot.run("YOUR_DISCORD_TOKEN")