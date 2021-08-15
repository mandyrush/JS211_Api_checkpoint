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

        // Set initial scores
        updateScore();
        console.log('Initial gameState: ', gameState);
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

            if (hasFourOfAKind(turn, card.value)) {
                addPoint(turn);
                discardMatches(turn, card.value);
            }
        });

        gameState.remainingCards = json.remaining;

        if(turn === 'player') {
            showPlayerCards (gameState[turn]['cards']);
        }
    })
}

const createPlayerCards = (cards) => {
    const displayPlayerCards = document.getElementById('displayPlayerCards');
    displayPlayerCards.innerHTML = '';
    cards.forEach(card => {
        let newCard = createCard(card);
        displayPlayerCards.append(newCard);
    });
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
    if (gameState.turn === 'player') {
        showPlayerSelectMsg();
    }
}

const playerTurn = () => {
    if (gameState.player.cards.length === 0) {
        drawCards(gameState.deck.deck_id, 5, 'player');
    }
    
    showSelectedCardContainer();

    // Player selects a card from their hand to ask computer for
    console.log('Card Requested: ', gameState.player.selectedCard);
    let requestedCard = gameState.player.selectedCard;
    
    if (checkForMatches(requestedCard)) {
        createPlayerCards(gameState.player.cards);
        hideSelectedCardContainer();
        console.log('New gameState: ', gameState);
    } else {
        // Show Go Fish message
        showTurnMsg('Go Fish!');
        hideSelectedCardContainer();
        hidePlayerSelectMsg();
        changeTurns();
        drawCards(gameState.deck.deck_id, 1, 'player');
        console.log('New gameState: ', gameState);
        computerTurn();
    }
}

const computerTurn = () => {
    // Show Computer's Turn message
    setTimeout(() => {
        showTurnMsg('Computer\'s Turn!');

        if (gameState.computer.cards.length === 0) {
            drawCards(gameState.deck.deck_id, 5, 'computer');
        }

        //Pick a card from computer hand
        let selectedCard = gameState.computer.cards[Math.floor(Math.random() * gameState.computer.cards.length)];
        console.log('Selected Card: ', selectedCard);

        showComputerTurnInfo(selectedCard.value);

        setTimeout(() => {
            if (checkForMatches(selectedCard.value)) {
                createPlayerCards(gameState.player.cards);
                console.log('New gameState: ', gameState);
                computerTurn();
            } else {
                showTurnMsg('Your Turn!');
                showPlayerSelectMsg();
                changeTurns();
                drawCards(gameState.deck.deck_id, 1, 'computer');
                console.log('New gameState: ', gameState);
                showSelectedCardContainer();
            }
        }, 5000)
        
    }, 2000);
}

const checkForMatches = (requestedCard) => {
    // Check to see if the opponent has matching cards
    let opponentMatches = gameState[gameState.opponent].cards.filter(card => card.value === requestedCard);
    let turnMatches = gameState[gameState.turn].cards.filter(card => card.value === requestedCard);

    if (opponentMatches.length > 0) {
        let opponentMatchNum = parseInt(opponentMatches.length);
        let turnMatchNum = parseInt(turnMatches.length);
        
        if (opponentMatchNum + turnMatchNum === 4) {
            // Add a point for the turn
            addPoint(gameState.turn);

            // Remove matching cards from turn
            discardMatches(gameState.turn, requestedCard);

            // Remove matching cards from opponent
            discardMatches(gameState.opponent, requestedCard);

            updateScore();
        } else {
            // Add opponents matching cards to turn's hand
            let matchingOpponentCards = gameState[gameState.opponent].cards.filter(card => card.value === requestedCard);
            matchingOpponentCards.forEach(card => gameState[gameState.turn].cards.push(card));

            // Remove matching cards from opponent
            discardMatches(gameState.opponent, requestedCard);
        }
    }
    return opponentMatches.length > 0;
}

const discardMatches = (turn, cardValue) => {
    let removeMatches = gameState[turn].cards.filter(card => card.value !== cardValue);
    gameState[turn].cards = removeMatches;
}

const hasFourOfAKind = (turn, cardValue) => {
    let matches = gameState[turn].cards.filter(card => card.value === cardValue);
    return matches.length === 4;
}

const addPoint = (turn) => {
    gameState[turn].score +=1
}

const changeTurns = () => {
    if (gameState.turn === 'player') {
        gameState.turn = 'computer';
        gameState.opponent = 'player';
    } else {
        gameState.turn = 'player';
        gameState.opponent = 'computer';
    }
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

const showComputerTurnInfo = (info) => {
    let computerTurnInfo = document.getElementById('computerTurnInfo');
    computerTurnInfo.innerHTML = `The computer has requested: ${info}`;
    computerTurnInfo.classList.add('show');
}

const hideComputerTurnInfo = () => {
    let computerTurnInfo = document.getElementById('computerTurnInfo');
    computerTurnInfo.classList.remove('show');
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

// When all cards are gone the game is over
// Compare the scores to see who won
// Restart the game by creating a new deck
