// A single player plays the computer
let gameState = {
    deck: {},
    remainingCards: 52,
    player: {
        score: 0,
        cards: [],
        selectedCard: '',
        matches: []
    },
    computer: {
        score: 0,
        cards: [],
        matches: []
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
        drawCards(json.deck_id, 7, 'computer', true);
        // Draw cards for player
        drawCards(json.deck_id, 7, 'player', true);

        // Set initial scores
        updateScore();
        console.log('Initial gameState: ', gameState);
    })
}

const checkRemainingCards = (numCards) => {
    while (numCards > gameState.remainingCards) {
        numCards--;
        checkRemainingCards(numCards);
    } 
    return numCards;
}

const drawCards = (deckId, numCards, turn, initialTurn) => {
    // Make sure there are enough cards in the deck to draw new ones
    if (gameState.remainingCards === 0) {
        return;
    }

    // If there are less cards left in the deck than you are trying to draw, 
    // only draw what is remaining in the deck
    numCards = checkRemainingCards(numCards);

    fetch('https://deckofcardsapi.com/api/deck/' + deckId + '/draw/?count=' + numCards)
    .then(response => {
        // extract the json from the response
        return response.json();
    }).then(json => {
        // do something with the json payload
        // console.log("Response Payload: ", json);
        // Set the computer / player cards in the gamestate
        adjustCardValues(json.cards);

        if (turn === 'player' && !initialTurn) {
            showCardsDrawn(json.cards);
        }
        
        json.cards.forEach(card => {
            gameState[turn]['cards'].push(card);

            if (hasFourOfAKind(turn, card.value)) {
                recordMatches(turn, card.value);
                updateGameInfo();
                discardMatches(turn, card.value);
            }
        });

        gameState.remainingCards = json.remaining;
        updateGameInfo();

        if(turn === 'player') {
            setTimeout(() => {
                showPlayerCards (gameState[turn]['cards']);
            }, 1000);
        } 
    })
}

const adjustCardValues = (cards) => {
    return cards.map(card => {
        if (card.value === 'JACK') {
            card.value = 11;
        } else if (card.value === 'QUEEN') {
            card.value = 12;
        } else if (card.value === 'KING') {
            card.value = 13;
        } else if (card.value === 'ACE') {
            card.value = 14;
        }
    })
}

const createPlayerCards = (cards) => {
    const displayPlayerCards = document.getElementById('displayPlayerCards');
    displayPlayerCards.innerHTML = '';

    // Sort player hand
    let sortedCards = cards.sort((a, b) => {
        if (parseInt(a.value) > parseInt(b.value)) {
            return 1;
        } else {
            return -1;
        }
    });

    sortedCards.forEach(card => {
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
            gameState.player.selectedCard = card;
        
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
        drawCards(gameState.deck.deck_id, 5, 'player', false);
    }
    
    showSelectedCardContainer();

    // Player selects a card from their hand to ask computer for
    console.log('Card Requested: ', gameState.player.selectedCard.value);
    let requestedCard = gameState.player.selectedCard.value;
    
    if (checkForMatches(requestedCard)) {
        setTimeout(() => {
            updateGameInfo();
            createPlayerCards(gameState.player.cards);
            hideSelectedCardContainer();
            console.log('New gameState: ', gameState);
        }, 1000);
    } else {
        // Show Go Fish message
        showMessage('Go Fish!');
        hideSelectedCardContainer();
        hidePlayerSelectMsg();
        changeTurns();
        drawCards(gameState.deck.deck_id, 1, 'player', false);
        
        setTimeout(() => {
            computerTurn();
        }, 4000);
        console.log('New gameState: ', gameState);
    }
}

const computerTurn = () => {
    // Show Computer's Turn message
    hideCardsDrawn();
    showMessage('Computer\'s Turn!');

    if (gameState.computer.cards.length === 0) {
        drawCards(gameState.deck.deck_id, 5, 'computer', false);
    }

    // Pick a random card from computer hand
    // Set a default selected card
    let selectedCard;

    if (gameState.computer.cards.length >= 1) {
        console.log("Random Number: ", Math.floor(Math.random() * gameState.computer.cards.length));
        selectedCard = gameState.computer.cards[Math.floor(Math.random() * gameState.computer.cards.length)];
    } else {
        selectedCard = gameState.computer.cards[0];
    }

    console.log('Selected Card: ', selectedCard);

    showComputerTurnInfo(selectedCard);

    if (checkForMatches(selectedCard.value)) {
        setTimeout(() => {
            updateGameInfo();
            createPlayerCards(gameState.player.cards);
            console.log('New gameState: ', gameState);
        }, 2000);
        
        setTimeout(() => {
            computerTurn();
        }, 4000);
    } else {
        drawCards(gameState.deck.deck_id, 1, 'computer', false);
        
        setTimeout(() => {
            hideComputerTurnInfo();
            showMessage('Your Turn!');
            showPlayerSelectMsg();
            changeTurns();
        }, 4000);
        
        console.log('New gameState: ', gameState);
    }
}

const checkForMatches = (requestedCard) => {
    // Check to see if the opponent has matching cards
    let opponentMatches = gameState[gameState.opponent].cards.filter(card => card.value === requestedCard);
    let turnMatches = gameState[gameState.turn].cards.filter(card => card.value === requestedCard);

    if (opponentMatches.length > 0) {
        let opponentMatchNum = parseInt(opponentMatches.length);
        let turnMatchNum = parseInt(turnMatches.length);
        
        if (opponentMatchNum + turnMatchNum === 4) {
            // Record Matches
            recordMatches(gameState.turn, requestedCard);

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

const recordMatches = (turn, cardValue) => {
    addPoint(turn);
    updateScore();
    setTimeout(() => {
        let capitalName = turn.charAt(0).toUpperCase() + turn.slice(1);
        showMessage(`${capitalName} got a match!`);
    },3000);

    console.log(`Record Matches ${turn} ${cardValue}`);
    
    gameState[turn].matches.push(cardValue);

    console.log('Check for Win returns: ', checkForWin());
    if (checkForWin()) {
        showMessage(winnerMsg());
        resetGame();
    }
}

const discardMatches = (turn, cardValue) => {
    let removeMatches = gameState[turn].cards.filter(card => card.value !== cardValue);
    gameState[turn].cards = removeMatches;
}

const hasFourOfAKind = (turn, cardValue) => {
    let matches = gameState[turn].cards.filter(card => card.value === cardValue);
    return matches.length === 4;
}

const checkForWin = () => {
    return gameState.remainingCards === 0 && gameState.player.cards.length === 0 || gameState.remainingCards === 0 && gameState.computer.cards.length === 0;
}

resetGame = () => {
    gameState = {
        deck: {},
        remainingCards: 52,
        player: {
            score: 0,
            cards: [],
            selectedCard: '',
            matches: []
        },
        computer: {
            score: 0,
            cards: [],
            matches: []
        },
        turn: 'player',
        opponent: 'computer'
    }

    newGame();
}

const winnerMsg = () => {
    if (gameState.player.score > gameState.computer.score) {
        return 'You Win!';
    } else if (gameState.computer.score > gameState.player.score) {
        return 'The Computer Won... Try again';
    } else {
        return "It's a tie!";
    }
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

const showCardsDrawn = (cards) => {
    let playerTurnInfo = document.getElementById('playerTurnInfo');
    playerTurnInfo.innerHTML = '';

    let p = document.createElement('p');
    p.innerHTML = 'You Drew: ';
    playerTurnInfo.append(p);

    cards.forEach(card => {
        let img = document.createElement('img');
        img.setAttribute('src', card.image);
        playerTurnInfo.append(img);
    })
    
    playerTurnInfo.classList.add('show');
}

const hideCardsDrawn = () => {
    let playerTurnInfo = document.getElementById('playerTurnInfo');
    playerTurnInfo.classList.remove('show');
}

const showMessage = (msg) => {
    const message = document.getElementById('message');
    message.innerHTML = msg;
    message.classList.add('show');
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

    selectedCardBtn.innerHTML = `Request from computer`;
    selectedCardContainer.classList.add('show');
}

const hideSelectedCardContainer = () => {
    let selectedCardContainer = document.getElementById('selectedCardContainer');
    selectedCardContainer.classList.remove('show');
}

const showComputerTurnInfo = (info) => {
    let computerTurnInfo = document.getElementById('computerTurnInfo');
    computerTurnInfo.innerHTML = '';

    let img = document.createElement('img');
    if (info) {
        img.setAttribute('src', info.image);    
    } else {
        console.log('There was an error with the api image');
    }
    
    img.classList.add('computer-selected-card');

    let p = document.createElement('p');
    p.innerHTML = `The computer has requested:`;

    computerTurnInfo.append(p);
    computerTurnInfo.append(img); 
    
    computerTurnInfo.classList.add('show');
}

const hideComputerTurnInfo = () => {
    let computerTurnInfo = document.getElementById('computerTurnInfo');
    computerTurnInfo.classList.remove('show');
}

const updateGameInfo = () => {
    let cardsRemainingPara = document.getElementById('cardsRemainingInDeck');
    let playerMatches = document.getElementById('playerMatches');
    let computerMatches = document.getElementById('computerMatches');

    cardsRemainingPara.innerHTML = `Cards Remaining in Deck: ${gameState.remainingCards}`;
    playerMatches.innerHTML = `Player Matches: ${gameState.player.matches}`;
    computerMatches.innerHTML = `Computer Matches: ${gameState.computer.matches}`;
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


// @Todos
// If there is a match and no remaining cards in hand, draw from deck
// Make sure win game and reset are successful

// Make front end pretty
// Add "Let's Play Go Fish!" animation before game starts
// Tests
// Refine code
