// A single player plays the computer
let gameState = {
    deck: {},
    remainingCards: 52,
    player: {
        score: 0,
        cards: [],
        selectedCard: ''
    },
    computer: {
        score: 0,
        cards: []
    },
    turn: 'player',
    opponent: 'computer'
}

const newGame = () => {
    return fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(response => {
        // extract the json from the response
        // console.log("Response Status: ", response.status);
        return response.json();
    }).then(json => {
        // do something with the json payload
        // console.log("Response Payload: ", json);
        gameState.deck = json;
        return json;
    }).then(json => {
        // Draw cards for computer
        drawCards(json.deck_id, 7, 'computer');
        // Draw cards for player
        drawCards(json.deck_id, 7, 'player');
    })
}

const drawCards = (deckId, numCards, turn) => {
    fetch('https://deckofcardsapi.com/api/deck/' + deckId + '/draw/?count=' + numCards)
    .then(response => {
        // extract the json from the response
        return response.json();
    }).then(json => {
        // do something with the json payload
        // console.log("Response Payload: ", json);
        // Set the computer / player cards in the gamestate
        json.cards.forEach(card => {
            gameState[turn]['cards'].push(card);
        });

        gameState.remainingCards = json.remaining;

        console.log('Initial gameState: ', gameState);

        showPlayerCards (gameState[turn]['cards']);
    })
}

const createPlayerCards = (cards) => {
    const displayPlayerCards = document.getElementById('displayPlayerCards');
    displayPlayerCards.innerHTML = '';
    cards.forEach(card => {
        let newCard = createCard(card);
        displayPlayerCards.append(newCard);
    });

    // Set initial scores
    updateScore();
}

const createCard = (card) => {
    let cardImage = card.image;
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    let img = document.createElement('img');
    img.setAttribute('src', cardImage);
    cardDiv.append(img);

    cardDiv.addEventListener('click', () => {
        if(gameState.turn === 'player') {
            gameState.player.selectedCard = card.value;
        
            let playerCards = document.getElementsByClassName('card');

            for (i = 0; i < playerCards.length; i++) {
                playerCards[i].classList.remove('selected');
            }

            cardDiv.classList.add('selected');
        
            showSelectedCardContainer();
        }
    });

    return cardDiv;
}

const showPlayerCards = (cards) => {
    createPlayerCards(cards);
    // createPlayerCards(gameState.player.cards);
    if (gameState.turn === 'player') {
        showPlayerSelectMsg();
    } else {
        computerTurn();
    }
}

const playerTurn = () => {
    showSelectedCardContainer();

    // Player selects a card from their hand to ask computer for
    console.log('Card Requested: ', gameState.player.selectedCard);
    let requestedCard = gameState.player.selectedCard;
    
    compareCards(requestedCard);
}

const computerTurn = () => {
    // Show Computer's Turn message
    setTimeout(() => {
        showTurnMsg('Computer\'s Turn!');

        //Pick a card from computer hand
        let selectedCard = gameState.computer.cards[Math.floor(Math.random() * gameState.computer.cards.length)];
        console.log('Selected Card: ', selectedCard);

        compareCards(selectedCard);
    }, 2000);
}

const compareCards = (requestedCard) => {
    // Check to see if the opponent has matching cards
    let opponentMatches = gameState[gameState.opponent].cards.filter(card => card.value === requestedCard);
    let turnMatches = gameState[gameState.turn].cards.filter(card => card.value === requestedCard);

    if (opponentMatches.length > 0) {
        let opponentMatchNum = parseInt(opponentMatches.length);
        let turnMatchNum = parseInt(turnMatches.length);
        
        if (opponentMatchNum + turnMatchNum === 4) {
            // Add a point for the turn
            gameState[gameState.turn].score += 1;

            // Remove matching cards from turn
            let newTurnCards = gameState[gameState.turn].cards.filter(card => card.value !== requestedCard);
            gameState[gameState.turn].cards = newTurnCards;

            // Remove matching cards from opponent
            let newOpponentCards = gameState[gameState.opponent].cards.filter(card => card.value !== requestedCard);
            gameState[gameState.opponent].cards = newOpponentCards;
        } else {
            // Add opponents matching cards to turn's hand
            let matchingOpponentCards = gameState[gameState.opponent].cards.filter(card => card.value === requestedCard);
            matchingOpponentCards.forEach(card => gameState[gameState.turn].cards.push(card));

            // Remove matching cards from opponent
            let newOpponentCards = gameState[gameState.opponent].cards.filter(card => card.value !== requestedCard);
            gameState[gameState.opponent].cards = newOpponentCards;
        }
        
        createPlayerCards(gameState.player.cards);

        if (gameState.turn === 'player') {
            hideSelectedCardContainer();
        }
    } else {
        // Change Turns
        if (gameState.turn === 'player') {
            gameState.turn = 'computer';
            gameState.opponent = 'player';

            // Show Go Fish message
            showTurnMsg('Go Fish!');

            hideSelectedCardContainer();

            hidePlayerSelectMsg();
        } else {
            gameState.turn = 'player';
            gameState.opponent = 'computer';

            // Show Your Turn message
            showTurnMsg('Your Turn!');

            showPlayerSelectMsg();
        }

        drawCards(gameState.deck.deck_id, 1, gameState.turn);
    }

    console.log('New gameState: ', gameState);
}

const showTurnMsg = (msg) => {
    const guessMsg = document.getElementById('guessMsg');
    guessMsg.innerHTML = msg;
    guessMsg.classList.add('show');
}

const showPlayerSelectMsg = () => {
    let playerSelectMsg = document.getElementById('playerSelectMsg');
    playerSelectMsg.classList.add('show');
}

const hidePlayerSelectMsg = () => {
    let playerSelectMsg = document.getElementById('playerSelectMsg');
    playerSelectMsg.classList.remove('show');
}

const showSelectedCardContainer = () => {
    let selectedCardContainer = document.getElementById('selectedCardContainer');
    let selectedCardBtn = document.getElementById('selectedCardBtn');
    selectedCardBtn.innerHTML = `Request ${gameState.player.selectedCard} from computer`;
    selectedCardContainer.classList.add('show');
}

const hideSelectedCardContainer = () => {
    let selectedCardContainer = document.getElementById('selectedCardContainer');
    selectedCardContainer.classList.remove('show');
}

const updateScore = () => {
    let playerScoreContainer = document.getElementById('playerScore');
    let computerScoreContainer = document.getElementById('computerScore');   

    playerScoreContainer.innerHTML = `Player Score: ${gameState.player.score}`;
    computerScoreContainer.innerHTML = `Computer Score: ${gameState.computer.score}`;
}




// Get a deck of cards
const play = () => {
    // Create new deck
    newGame();
}

play();


// Repeat turn steps for computer asking player
// If either the computer or player runs out of cards, draw 1

// When all cards are gone the game is over
// Compare the scores to see who won
// Restart the game by creating a new deck
