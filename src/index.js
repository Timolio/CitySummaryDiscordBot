require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

const getSummaryEmbed = async city => {
    try {
        console.log(`Getting weather for ${city}...`);
        const geoResponse = await axios.get(
            `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
                city
            )}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
        );

        if (!geoResponse.data.length) {
            return { error: '❌ City not found! Try again.' };
        }

        const { lat, lon, name, country } = geoResponse.data[0];
        console.log(geoResponse.data);

        const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=${process.env.OPENWEATHER_API_KEY}`
        );

        const timeResponse = await axios.get(
            `https://api.api-ninjas.com/v1/worldtime?lat=${lat}&lon=${lon}`,
            {
                headers: {
                    'X-Api-Key': process.env.API_NINJAS_API_KEY,
                },
            }
        );

        const datetime = timeResponse.data.datetime;
        const weather = weatherResponse.data;
        const temp = weather.main.temp;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Summary for ${name}, ${country}`)
            .setColor(getTemperatureColor(temp))
            .addFields(
                { name: '🌡️ Temperature', value: `${temp}°C`, inline: true },
                {
                    name: '💨 Wind',
                    value: `${weather.wind.speed} m/s`,
                    inline: true,
                },
                {
                    name: '💧 Humidity',
                    value: `${weather.main.humidity}%`,
                    inline: true,
                },
                {
                    name: '🌫️ Feels like',
                    value: `${weather.main.feels_like}°C`,
                    inline: true,
                },
                { name: '🕒 Local Time', value: datetime, inline: true }
            )
            .setThumbnail(
                `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
            )
            .setTimestamp()
            .setFooter({
                text: 'Data provided by OpenWeatherMap and API Ninjas',
            });

        return { embed };
    } catch (error) {
        return { error: `❌ Error getting the data!` };
    }
};

const getTemperatureColor = temp => {
    if (temp < 0) return '#00b4d8';
    if (temp < 15) return '#38b000';
    if (temp < 25) return '#ff9500';
    return '#d00000';
};

client.on('ready', c => {
    console.log(`✅ ${c.user.tag} is online.`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'summary') {
        const cityName = interaction.options.get('city').value;

        const result = await getSummaryEmbed(cityName);

        if (result.error) {
            interaction.reply(result.error);
        } else {
            interaction.reply({ embeds: [result.embed] });
        }
    }
});

client.login(process.env.TOKEN);
