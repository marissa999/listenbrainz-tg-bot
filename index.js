'use strict';

const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const config = require('./config.json');
const token = config.token;

const bot = new TelegramBot(token, {polling: true});

bot.on("inline_query", async (inline_query) => {

	console.log(inline_query.from.id)

	const listenBrainzUsername = await getListenBrainzUsernameFromTelegramId(inline_query.from.id)

	if (inline_query.from.id != 3049432){
		bot.answerInlineQuery(inline_query.id, [], {cache_time: 0, is_personal: true})
		return
	}

	if (listenBrainzUsername == null || listenBrainzUsername == ""){
		bot.answerInlineQuery(inline_query.id, [], {cache_time: 0, is_personal: true})
		return
	}

	console.log("listenbrainz username: " + listenBrainzUsername)

	let inlineQueryResult = []

	const playingNowFetch = await fetch("https://api.listenbrainz.org/1/user/" + listenBrainzUsername + "/playing-now");
	const playingNowResult = await playingNowFetch.json()

	let listensToGet

	if (playingNowResult.payload.listens.length == 1){
		console.log("The user " + listenBrainzUsername + "is currently listening to something");
		console.log(playingNowResult)
		const songdata = playingNowResult.payload.listens[0].track_metadata
		inlineQueryResult.push(makeInlineQueryArticle(0, listenBrainzUsername, songdata.track_name, songdata.release_name, songdata.artist_name, "https://ia802502.us.archive.org/10/items/mbid-d93414fd-7732-448d-a123-4f9c73c5723c/mbid-d93414fd-7732-448d-a123-4f9c73c5723c-32503308118.jpg", true))
		listensToGet = 4
	} else {
		listensToGet = 5
	}

	const pastListensFetch = await fetch("https://api.listenbrainz.org/1/user/" + listenBrainzUsername + "/listens?count=" + listensToGet);
	const pastListensResult = await pastListensFetch.json()
	let count = 0

	count = count + 1
	for (const listen of pastListensResult.payload.listens){
		inlineQueryResult.push(makeInlineQueryArticle(count, listenBrainzUsername, listen.track_metadata.track_name, listen.track_metadata.release_name, listen.track_metadata.artist_name, "https://ia802502.us.archive.org/10/items/mbid-d93414fd-7732-448d-a123-4f9c73c5723c/mbid-d93414fd-7732-448d-a123-4f9c73c5723c-32503308118.jpg", false))
		count = count + 1
	}

	bot.answerInlineQuery(inline_query.id, inlineQueryResult, {
		cache_time: 0,
		is_personal: true
	})
});

async function getListenBrainzUsernameFromTelegramId(telegramID) {
	if (telegramID == 3049432)
		return "marissachan"
}

function makeInlineQueryArticle(id, listenBrainzUsername, title, album, artist, albumThumbUrl, isCurrentlyListening){
	let description;
	if (isCurrentlyListening)
		description = title + " - " + album + " (Playing now)"
	else
		description = title + " - " + album

	let message_text;
	if (isCurrentlyListening)
		message_text = "<b>" + listenBrainzUsername + "</b> is currently listenting to <b>" + title + "</b> from <b>" + album + "</b>"
	else
		message_text = "<b>" + listenBrainzUsername + "</b> listened to <b>" + title + "</b> from <b>" + album + "</b>"
	
	return {
		type: 'article',
		id: id,
		cacheTime: 0,
		title: title,
		description: description,
		thumb_url: albumThumbUrl,
		input_message_content: {
			message_text: message_text,
			parse_mode: 'HTML',
			disable_web_page_preview: true
		}
	}
}