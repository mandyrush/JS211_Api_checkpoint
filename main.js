// A single player plays the computer
// Set time out is used throughout to slow down the game so you can follow each turn

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
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(response => {
        // extract the json from the response
        // console.log("Response Status: ", response.status);
        return response.json();
    }).then(json => {
        // Add the deck information to the gameState
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
    }).catch(error => {
        console.log('Error: ', error);
        showErrorMsg();

        setTimeout(() => {
            hideErrorMsg();
        }, 7000)
    })
}



const drawCards = (deckId, numCards, turn, initialTurn) => {
    // Make sure there are cards in the deck to draw new ones
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
        // Set the computer / player cards in the gamestate

        // Change the card values of Jack, Queen, King and Ace to numeric values
        adjustCardValues(json.cards);

        //Only show the cards that were drawn if it is the player's turn and not the initial draw
        if (turn === 'player' && !initialTurn) {
            showCardsDrawn(json.cards);
        }
        
        // Add the cards drawn to whoever's turn it is
        json.cards.forEach(card => {
            gameState[turn]['cards'].push(card);

            // If a card is drawn that gives four of a kind
            // Add it to your match list, 
            // Update the score and remove the matches from the hand
            // Check to see if the match caused a win
            if (hasFourOfAKind(turn, card.value)) {
                recordMatches(turn, card.value);
                updateGameInfo();
                discardMatches(turn, card.value);

                if (checkForWin()) {
                    showMessage(winnerMsg());
                    showResetGameBtn();
                    return;
                }
            }
        })

        // Update the cards remaining in the deck
        gameState.remainingCards = json.remaining;
        
        // Update remaining cards shown in game info
        updateGameInfo();

        // If it is the player's turn, update their hand
        if(turn === 'player') {
            setTimeout(() => {
                showPlayerCards (gameState[turn]['cards']);
            }, 2000);
        } 
    }).catch(error => {
        console.log('Error: ', error);
        showErrorMsg();

        setTimeout(() => {
            hideErrorMsg();
        }, 7000)
    })
}



const createPlayerCards = (cards) => {
    // Reset the element that shows the current player's cards
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

    // Add the new cards to the player's hand
    sortedCards.forEach(card => {
        let newCard = createCard(card);
        displayPlayerCards.append(newCard);
    });
}

const createCard = (card) => {
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card');

    let img = document.createElement('img');
    let cardImage = card.image;
    img.setAttribute('src', cardImage);

    cardDiv.append(img);

    // Add a click event to each of the player's cards so that when you click on it
    // the selected card will be shown and recorded
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

    // Show message to prompt the player to select a card
    if (gameState.turn === 'player') {
        showPlayerSelectMsg();
    }
}

const playerTurn = () => {
    showTurnMessage("Your Turn");
    hideMessage();

    // If the player doesn't have any cards in their hand, draw new ones
    if (gameState.player.cards.length === 0) {
        drawCards(gameState.deck.deck_id, 5, 'player', false);
    }

    // Show the card(s) the player drew
    showSelectedCardContainer();

    // When the player clcks on a card they select it as the one to ask the computer for
    console.log('Card Requested: ', gameState.player.selectedCard.value);
    let requestedCard = gameState.player.selectedCard.value;
    
    // Check computer's hand for matches
    if (checkForMatches(requestedCard, 'Player')) {

        // If there were matches update the score
        // Update the player's cards
        // Hide the message showing what card the player originally selected
        setTimeout(() => {
            updateGameInfo();
            createPlayerCards(gameState.player.cards);
            hideSelectedCardContainer();
            console.log('New gameState: ', gameState);

            // If the match was the last cards in the player's hand, draw more cards
            if (gameState.player.cards.length === 0) {
                drawCards(gameState.deck.deck_id, 5, 'player', false);
            }
        }, 2000);
    } else {
        // Show Go Fish message
        // Draw a card
        // Hide messages from player's turn
        // Make it the computer's turn
        showMessage('Go Fish!');
        drawCards(gameState.deck.deck_id, 1, 'player', false);
        hideSelectedCardContainer();
        hidePlayerSelectMsg();
        changeTurns();
        
        setTimeout(() => {
            computerTurn();
            hideMessage();
        }, 3000);
        console.log('New gameState: ', gameState);
    }
}

const computerTurn = () => {
    // Show Computer's Turn message
    showTurnMessage("Computer's Turn");
    hideMessage();
    hideCardsDrawn();

    // Check for a win
    if (checkForWin()) {
        showMessage(winnerMsg());
        showResetGameBtn();
        return;
    }

    // If the computer doesn't have any cards left in it's hand, draw more cards
    if (gameState.computer.cards.length === 0) {
        drawCards(gameState.deck.deck_id, 5, 'computer', false);
    }

    // Delay so drawCards can finish
    // Pick a random card from computer hand
    // Set a default selected card
    setTimeout(() => {
        let selectedCard;

        // If the computer has multiple cards in it's hand, select a random card
        if (gameState.computer.cards.length >= 1) {
            console.log("Random Number: ", Math.floor(Math.random() * gameState.computer.cards.length));
            selectedCard = gameState.computer.cards[Math.floor(Math.random() * gameState.computer.cards.length)];
        } else {
            // Select the first card the computer has in it's hand
            selectedCard = gameState.computer.cards[0];
        }
    
        console.log('Selected Card: ', selectedCard);
    
        // Show the card the computer has requested
        showComputerTurnInfo(selectedCard);
    
        // Check to see if the player has any matching cards
        if (checkForMatches(selectedCard.value, 'Computer')) {
            setTimeout(() => {
                // Update the score
                // Update the player's cards
                updateGameInfo();
                createPlayerCards(gameState.player.cards);
                console.log('New gameState: ', gameState);

                // If the computer got a match, go again
                computerTurn();
            }, 2000);
        } else {
            // If the computer doesn't have a match, draw a card
            drawCards(gameState.deck.deck_id, 1, 'computer', false);
            
            setTimeout(() => {
                // Change turns to player
                // Hide messages about computer's turn
                // Show messages about player's turn
                changeTurns();
                hideMessage();
                hideComputerTurnInfo();
                showTurnMessage('Your Turn');
                showPlayerSelectMsg();
            }, 3000);
            
            console.log('New gameState: ', gameState);
        }
    }, 2000);
}

const checkForMatches = (requestedCard, turn) => {
    // Check to see if the opponent has matching cards
    let opponentMatches = gameState[gameState.opponent].cards.filter(card => card.value === requestedCard);
    let turnMatches = gameState[gameState.turn].cards.filter(card => card.value === requestedCard);

    // If the opponent has matches, count them and count the player's matches to see if the total is 4
    if (opponentMatches.length > 0) {
        let opponentMatchNum = parseInt(opponentMatches.length);
        let turnMatchNum = parseInt(turnMatches.length);
        
        if (opponentMatchNum + turnMatchNum === 4) {
            // Record Matches
            recordMatches(gameState.turn, requestedCard);

            // Remove matching cards from turn's hand
            discardMatches(gameState.turn, requestedCard);

            // Remove matching cards from opponent's hand
            discardMatches(gameState.opponent, requestedCard);

            updateScore();
        } else {
            showMessage(turn + ' got a match!');
            // If there are not 4 of a kind in the match
            // Add opponents matching cards to turn's hand
            let matchingOpponentCards = gameState[gameState.opponent].cards.filter(card => card.value === requestedCard);
            matchingOpponentCards.forEach(card => gameState[gameState.turn].cards.push(card));

            // Remove matching cards from opponent
            discardMatches(gameState.opponent, requestedCard);
        }
    }

    // Were there any matches?
    return opponentMatches.length > 0;
}

const recordMatches = (turn, cardValue) => {
    addPoint(turn);
    updateScore();
    setTimeout(() => {
        // Show a message that there was a match 
        // Make the message look better by capitalizing the first letter
        let capitalName = turn.charAt(0).toUpperCase() + turn.slice(1);
        showMessage(`${capitalName} got a point!`);
    },3000);

    console.log(`Record Matches ${turn} ${cardValue}`);
    
    // Record the matches in the gameState
    gameState[turn].matches.push(cardValue + ' ');

    console.log('Check for Win returns: ', checkForWin());

    setTimeout(() => {
        // Check for a win
        if (checkForWin()) {
            showMessage(winnerMsg());
            showResetGameBtn();
        }
    }, 3000)
}


// Helper Functions
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

const checkRemainingCards = (numCards) => {
    while (numCards > gameState.remainingCards) {
        numCards--;
        checkRemainingCards(numCards);
    } 
    return numCards;
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
    showTurnMessage("Your Turn");
    showPlayerSelectMsg();
    hideMessage();
    hideResetGameBtn();

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

showResetGameBtn = () => {
    let resetGameContainer = document.getElementById('resetGameContainer');
    resetGameContainer.classList.add('show');

    hideComputerTurnInfo();
    hidePlayerTurnInfo();
    hideSelectedCardContainer();
    hidePlayerSelectMsg();
}

hideResetGameBtn = () => {
    let resetGameContainer = document.getElementById('resetGameContainer');
    resetGameContainer.classList.remove('show');
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
    p.innerHTML = 'You Drew a... ';
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

const hideMessage = () => {
    const message = document.getElementById('message');
    message.classList.remove('show');
}

const showTurnMessage = (msg) => {
    const message = document.getElementById('turnMessage');
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
    p.innerHTML = `The computer has requested a...`;

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

showErrorMsg = () => {
    let errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.add('show');
}

hideErrorMsg = () => {
    let errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.remove('show');
}

// Get a deck of cards
const play = () => {
    // Create new deck
    newGame();
    showTurnMessage("Your Turn");
}

play();


// @Todos
// Add Tests
