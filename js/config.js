/* ──────────────────────────────────────────────────────────
   Edit this file to personalise the surprise.
   You can also override name / from in the link:
   https://YOURNAME.github.io/birthday-surprise/?name=Riya&from=Sam
   ────────────────────────────────────────────────────────── */
window.CONFIG = {
  name: "Rashi",                      // who it's for
  from: "Sushant",                  // sign-off at the end of the letter

  // Line shown at the top while the bouquet scene plays
  bouquetTop: "I will love you until the last flower dies.",

  // Short line shown at the end of the bouquet scene (3–4 words). {name} works here too.
  bouquetMsg: "Some things never fade",

  // Shown after the candle is blown out
  cheer: "Cheers to another great year!",

  // One word per balloon (up to 8). They appear under "You are my"
  balloonWords: ["Rashu", "Baccha", "left ventricle", "butterfly", "Rashudiii", "Laadooo", "Pilla", "Sunflower"],

  // Photo cards. Upload your photos to assets/photos/ named exactly 1.jpeg, 2.jpeg, 3.jpeg
  // (they replace the placeholders). Portrait photos look nicest.
  // Want more? Add 4.jpeg … and a new line below.
  photos: [
    { src: "assets/photos/1.jpeg", caption: "The beginning of forever." },
    { src: "assets/photos/2.jpeg", caption: "Twinning in our best." },
    { src: "assets/photos/3.jpeg", caption: "Just you and me." }
  ],

  // The letter. Each string is one paragraph ("Dear <name>," and the sign-off are added automatically).
  letter: [
    "30th August was the day I saw you for the first time. Our conversation was a little formal and a little awkward 🙈, and I had no idea what I was walking into.",
    "On 3rd September we had our first phone call, and I never wanted it to end. 📞",
    "Then came 7th September, when we said YES to each other. It felt so surreal. ✨",
    "On 21st September we met again, and with the blessings of both our families, we made it official. 🙏",
    "The days went by like months, and then 29th October arrived, with everyone we love watching as we got Rokafied. 🎉",
    "And now here we are, today, and I thank God for this beautiful day that gave me you. 🎂",
    "On this special day, I wish you all the happiness, love and joy that you deserve. You’re sweet, loyal, my rock, and I’m so grateful to have you in my life. Every moment with you is precious. 💖",
    "Here’s to many more beautiful memories together. 🥂"
  ],

  // Last line, under the signature
  hashtag: "#OursIsAGodPlan 🤍",

  // Button labels
  btnBouquet: "Flashback Time!",   // after the bouquet
  btnMemories: "Let me express", // after the photo cards

  // Music — one song plays from the gift all the way to the end of the letter.
  // To use your own song, upload it to assets/music/ and change the path.
  music: {
    party:    "assets/music/party.mp3"
  },

  // While the letter is being printed the music gets quieter: 1 = unchanged, 0.45 = noticeably lower, 0 = silent.
  letterMusicVolume: 0.45,

  // The music stops this many seconds after the whole letter has been printed (it fades out gently).
  // Set to false to let it keep playing.
  letterMusicStopAfter: 5,

  // Colour of "You are my" on the balloon page (any CSS colour).
  balloonSubColor: "#7a3db8",

  // One knob for all the music: 1 = as set, 0.5 = half as loud, 1.5 = louder.
  musicVolume: 1,

  // Little sound effects (balloon pops, ribbon, cake, cheers, card swipes…). Set to false to turn them off.
  sfx: true
};
