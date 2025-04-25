// 游戏配置
const config = {
    initialSpeed: 150,
    speedIncrease: 2,
    gridSize: 20,
    initialLength: 3,
    foodValue: 10,
    coinChance: 0.4,
    coinValue: 10,
    comboTimeWindow: 5000,
    comboMultiplier: 1.5,
    // 移动端配置
    swipeThreshold: 30,        // 滑动触发阈值
    doubleTapDelay: 300,      // 双击判定时间（毫秒）
    touchSensitivity: 1.2     // 触摸灵敏度
};

// 商店物品
const shopItems = {
    classic: {
        name: "经典蛇",
        description: "最初的开始",
        price: 0,
        owned: true,
        color: "#4CAF50"
    },
    rainbow: {
        name: "彩虹蛇",
        description: "炫彩夺目",
        price: 100,
        owned: false,
        color: "rainbow"
    },
    golden: {
        name: "黄金蛇",
        description: "尊贵体验",
        price: 200,
        owned: false,
        color: "#FFD700"
    },
    neon: {
        name: "霓虹蛇",
        description: "闪耀光芒",
        price: 300,
        owned: false,
        color: "#00ff00"
    },
    dragon: {
        name: "神龙",
        description: "腾云驾雾",
        price: 500,
        owned: false,
        color: "#FF4500",
        special: "dragon"
    },
    centipede: {
        name: "蜈蚣",
        description: "百足之虫",
        price: 400,
        owned: false,
        color: "#8B4513",
        special: "centipede"
    }
};

// 游戏状态
let gameState = {
    snake: [],
    direction: "right",
    nextDirection: "right",
    food: null,
    coin: null,
    score: 0,
    coins: 0,
    speed: config.initialSpeed,
    gameLoop: null,
    selectedSkin: "classic",
    paused: false,
    combo: 0,
    lastFoodTime: 0
};

// 初始化游戏
function initGame() {
    const canvas = document.getElementById("gameCanvas");
    const gridSize = config.gridSize;

    // 重置游戏状态
    gameState = {
        ...gameState,
        snake: [],
        score: 0,
        speed: config.initialSpeed,
        direction: "right",
        nextDirection: "right",
        food: null,
        coin: null,
        paused: false
    };

    // 初始化蛇的位置（从画布中心开始）
    const startX = Math.floor((canvas.width / gridSize / 2)) * gridSize;
    const startY = Math.floor((canvas.height / gridSize / 2)) * gridSize;
    
    // 创建初始蛇身
    for (let i = 0; i < config.initialLength; i++) {
        gameState.snake.push({
            x: startX - (i * gridSize),
            y: startY
        });
    }

    // 生成第一个食物
    spawnFood();

    // 清除之前的游戏循环
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }

    // 开始新的游戏循环
    gameState.gameLoop = setInterval(gameLoop, gameState.speed);

    // 更新显示
    updateScore();
    updateCoins();
    
    // 立即绘制第一帧
    drawGame();
}

// 游戏主循环
function gameLoop() {
    if (gameState.paused) return;

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const gridSize = config.gridSize;

    // 更新蛇的方向
    gameState.direction = gameState.nextDirection;

    // 计算新的头部位置
    const head = { ...gameState.snake[0] };
    switch (gameState.direction) {
        case "up": head.y -= gridSize; break;
        case "down": head.y += gridSize; break;
        case "left": head.x -= gridSize; break;
        case "right": head.x += gridSize; break;
    }

    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // 移动蛇
    gameState.snake.unshift(head);

    // 检查是否吃到食物
    if (gameState.food && head.x === gameState.food.x && head.y === gameState.food.y) {
        const now = Date.now();
        // 检查连击
        if (now - gameState.lastFoodTime < config.comboTimeWindow) {
            gameState.combo++;
        } else {
            gameState.combo = 1;
        }
        gameState.lastFoodTime = now;

        // 计算得分（包含连击加成）
        const comboBonus = Math.min(gameState.combo * config.comboMultiplier, 3);
        gameState.score += Math.floor(config.foodValue * comboBonus);
        
        gameState.speed = Math.max(50, config.initialSpeed - Math.floor(gameState.score / 100) * config.speedIncrease);
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = setInterval(gameLoop, gameState.speed);
        spawnFood();
        
        // 增加金币生成机会
        if (Math.random() < config.coinChance) {
            spawnCoin();
        }
        // 连击达到3次时必定生成金币
        if (gameState.combo >= 3) {
            spawnCoin();
        }
        
        updateScore();
    } else {
        gameState.snake.pop();
    }

    // 检查是否吃到金币
    if (gameState.coin && head.x === gameState.coin.x && head.y === gameState.coin.y) {
        // 根据连击次数增加金币奖励
        const coinBonus = Math.min(gameState.combo, 3);
        gameState.coins += Math.floor(config.coinValue * coinBonus);
        gameState.coin = null;
        updateCoins();
    }

    // 绘制游戏画面
    drawGame();
}

// 绘制游戏画面
function drawGame() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const gridSize = config.gridSize;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 获取当前皮肤
    const skin = shopItems[gameState.selectedSkin];

    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        let segmentColor;
        
        // 处理特殊皮肤效果
        if (skin.special === "dragon") {
            // 龙的渐变色效果
            const gradientPos = index / gameState.snake.length;
            segmentColor = `hsl(${30 + gradientPos * 30}, 100%, ${50 + gradientPos * 20}%)`;
            
            // 添加龙的鳞片效果
            if (index > 0) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                ctx.beginPath();
                ctx.arc(segment.x + gridSize/2, segment.y + gridSize/2, gridSize/3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (skin.special === "centipede") {
            // 蜈蚣节段效果
            segmentColor = index % 2 === 0 ? skin.color : "#654321";
        } else if (skin.color === "rainbow") {
            // 彩虹效果
            segmentColor = `hsl(${(index * 20 + Date.now() / 50) % 360}, 100%, 50%)`;
        } else {
            segmentColor = skin.color;
        }

        // 设置颜色并绘制身体段
        ctx.fillStyle = segmentColor;
        ctx.fillRect(segment.x, segment.y, gridSize - 2, gridSize - 2);

        // 为蛇头添加特殊显示
        if (index === 0) {
            // 绘制眼睛
            ctx.fillStyle = "#000000";
            const eyeSize = 4;
            const eyeOffset = 3;
            
            // 根据方向调整眼睛位置
            switch(gameState.direction) {
                case "right":
                    ctx.fillRect(segment.x + gridSize - eyeOffset - 2, segment.y + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(segment.x + gridSize - eyeOffset - 2, segment.y + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
                case "left":
                    ctx.fillRect(segment.x + eyeOffset, segment.y + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(segment.x + eyeOffset, segment.y + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
                case "up":
                    ctx.fillRect(segment.x + eyeOffset, segment.y + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect(segment.x + gridSize - eyeOffset - eyeSize, segment.y + eyeOffset, eyeSize, eyeSize);
                    break;
                case "down":
                    ctx.fillRect(segment.x + eyeOffset, segment.y + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    ctx.fillRect(segment.x + gridSize - eyeOffset - eyeSize, segment.y + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
            }

            // 为龙添加特殊头部效果
            if (skin.special === "dragon") {
                // 添加龙角
                ctx.fillStyle = "#FFD700";
                const hornSize = 6;
                const hornOffset = 2;
                
                switch(gameState.direction) {
                    case "right":
                        ctx.beginPath();
                        ctx.moveTo(segment.x + gridSize - hornOffset, segment.y + hornOffset);
                        ctx.lineTo(segment.x + gridSize + hornSize, segment.y - hornSize);
                        ctx.lineTo(segment.x + gridSize - hornOffset, segment.y + hornSize);
                        ctx.fill();
                        break;
                    case "left":
                        ctx.beginPath();
                        ctx.moveTo(segment.x + hornOffset, segment.y + hornOffset);
                        ctx.lineTo(segment.x - hornSize, segment.y - hornSize);
                        ctx.lineTo(segment.x + hornOffset, segment.y + hornSize);
                        ctx.fill();
                        break;
                    case "up":
                        ctx.beginPath();
                        ctx.moveTo(segment.x + hornOffset, segment.y + hornOffset);
                        ctx.lineTo(segment.x - hornSize, segment.y - hornSize);
                        ctx.lineTo(segment.x + hornSize, segment.y - hornSize);
                        ctx.fill();
                        break;
                    case "down":
                        ctx.beginPath();
                        ctx.moveTo(segment.x + hornOffset, segment.y + gridSize - hornOffset);
                        ctx.lineTo(segment.x - hornSize, segment.y + gridSize + hornSize);
                        ctx.lineTo(segment.x + hornSize, segment.y + gridSize + hornSize);
                        ctx.fill();
                        break;
                }
            }
        }
    });

    // 绘制食物
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(
        gameState.food.x + gridSize/2,
        gameState.food.y + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 绘制金币
    if (gameState.coin) {
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(
            gameState.coin.x + gridSize/2,
            gameState.coin.y + gridSize/2,
            gridSize/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// 生成食物
function spawnFood() {
    const canvas = document.getElementById("gameCanvas");
    const gridSize = config.gridSize;
    const maxX = canvas.width / gridSize;
    const maxY = canvas.height / gridSize;

    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * maxX) * gridSize,
            y: Math.floor(Math.random() * maxY) * gridSize
        };
    } while (isPositionOccupied(newFood));

    gameState.food = newFood;
}

// 生成金币
function spawnCoin() {
    const canvas = document.getElementById("gameCanvas");
    const gridSize = config.gridSize;
    const maxX = canvas.width / gridSize;
    const maxY = canvas.height / gridSize;

    let newCoin;
    do {
        newCoin = {
            x: Math.floor(Math.random() * maxX) * gridSize,
            y: Math.floor(Math.random() * maxY) * gridSize
        };
    } while (isPositionOccupied(newCoin));

    gameState.coin = newCoin;
}

// 检查位置是否被占用
function isPositionOccupied(position) {
    return gameState.snake.some(segment => 
        segment.x === position.x && segment.y === position.y
    ) || (gameState.food && gameState.food.x === position.x && gameState.food.y === position.y)
    || (gameState.coin && gameState.coin.x === position.x && gameState.coin.y === position.y);
}

// 检查碰撞
function checkCollision(head) {
    const canvas = document.getElementById("gameCanvas");
    
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height) {
        return true;
    }

    // 检查自身碰撞
    return gameState.snake.slice(1).some(segment =>
        segment.x === head.x && segment.y === head.y
    );
}

// 游戏结束
function gameOver() {
    clearInterval(gameState.gameLoop);
    document.getElementById("finalScore").textContent = gameState.score;
    document.getElementById("gameOver").style.display = "block";
    
    // 更新排行榜
    updateLeaderboard(gameState.score);
}

// 重启游戏
function restartGame() {
    document.getElementById("gameOver").style.display = "none";
    initGame();
}

// 更新分数显示
function updateScore() {
    const scoreElement = document.getElementById("score");
    scoreElement.textContent = gameState.score;
    
    // 显示连击信息
    if (gameState.combo > 1) {
        scoreElement.textContent += ` (${gameState.combo}连击!)`;
    }
}

// 更新金币显示
function updateCoins() {
    document.getElementById("coins").textContent = gameState.coins;
    document.getElementById("shopCoins").textContent = gameState.coins;
}

// 切换游戏画面
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.style.display = "none";
    });
    document.getElementById(screenId).style.display = "flex";

    if (screenId === "gameScreen") {
        initGame();
    } else if (screenId === "shopScreen") {
        updateShop();
    } else if (screenId === "leaderboardScreen") {
        displayLeaderboard();
    }
}

// 更新商店显示
function updateShop() {
    const shopContainer = document.getElementById("shopItems");
    shopContainer.innerHTML = "";

    Object.entries(shopItems).forEach(([id, item]) => {
        const itemElement = document.createElement("div");
        itemElement.className = "shop-item";
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>价格: ${item.price} 金币</p>
            <button class="menu-button" onclick="purchaseItem('${id}')"
                ${item.owned ? 'disabled' : ''}>
                ${item.owned ? '已拥有' : '购买'}
            </button>
            ${item.owned ? `
                <button class="menu-button" onclick="selectSkin('${id}')"
                    ${gameState.selectedSkin === id ? 'disabled' : ''}>
                    ${gameState.selectedSkin === id ? '使用中' : '使用'}
                </button>
            ` : ''}
        `;
        shopContainer.appendChild(itemElement);
    });
}

// 购买物品
function purchaseItem(itemId) {
    const item = shopItems[itemId];
    if (gameState.coins >= item.price && !item.owned) {
        gameState.coins -= item.price;
        item.owned = true;
        updateCoins();
        updateShop();
        saveGameData();
    }
}

// 选择皮肤
function selectSkin(skinId) {
    if (shopItems[skinId].owned) {
        gameState.selectedSkin = skinId;
        updateShop();
        saveGameData();
    }
}

// 更新排行榜
function updateLeaderboard(score) {
    let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard") || "[]");
    leaderboard.push({
        score: score,
        date: new Date().toLocaleDateString()
    });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard));
}

// 显示排行榜
function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard") || "[]");
    const leaderboardElement = document.getElementById("leaderboard");
    leaderboardElement.innerHTML = "";

    leaderboard.forEach((entry, index) => {
        const li = document.createElement("li");
        li.className = "leaderboard-item";
        li.innerHTML = `
            <span>#${index + 1}</span>
            <span>${entry.score}分</span>
            <span>${entry.date}</span>
        `;
        leaderboardElement.appendChild(li);
    });
}

// 保存游戏数据
function saveGameData() {
    const gameData = {
        coins: gameState.coins,
        shopItems: shopItems,
        selectedSkin: gameState.selectedSkin
    };
    localStorage.setItem("snakeGameData", JSON.stringify(gameData));
}

// 加载游戏数据
function loadGameData() {
    const savedData = JSON.parse(localStorage.getItem("snakeGameData") || "{}");
    if (savedData.coins) {
        gameState.coins = savedData.coins;
    }
    if (savedData.shopItems) {
        Object.assign(shopItems, savedData.shopItems);
    }
    if (savedData.selectedSkin) {
        gameState.selectedSkin = savedData.selectedSkin;
    }
    updateCoins();
}

// 初始化触控按钮
function initTouchControls() {
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const canvas = document.getElementById('gameCanvas');

    // 处理触摸事件
    function handleTouch(direction) {
        if (gameState.paused) return;
        
        switch(direction) {
            case 'up':
                if (gameState.direction !== "down") {
                    gameState.nextDirection = "up";
                }
                break;
            case 'down':
                if (gameState.direction !== "up") {
                    gameState.nextDirection = "down";
                }
                break;
            case 'left':
                if (gameState.direction !== "right") {
                    gameState.nextDirection = "left";
                }
                break;
            case 'right':
                if (gameState.direction !== "left") {
                    gameState.nextDirection = "right";
                }
                break;
        }
    }

    // 方向按钮事件
    const buttons = [
        { el: upBtn, dir: 'up' },
        { el: downBtn, dir: 'down' },
        { el: leftBtn, dir: 'left' },
        { el: rightBtn, dir: 'right' }
    ];

    buttons.forEach(btn => {
        ['touchstart', 'mousedown'].forEach(event => {
            btn.el.addEventListener(event, (e) => {
                e.preventDefault();
                handleTouch(btn.dir);
            });
        });
    });

    // 双击暂停
    let lastTap = 0;
    canvas.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < config.doubleTapDelay && tapLength > 0) {
            e.preventDefault();
            gameState.paused = !gameState.paused;
        }
        lastTap = currentTime;
    });

    // 滑动控制
    let touchStartX = 0;
    let touchStartY = 0;
    let lastDirection = null;
    let touchStartTime = 0;

    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        lastDirection = null;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (gameState.paused) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        // 计算滑动速度
        const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
        const threshold = config.swipeThreshold * (speed > 1 ? 1 / speed : 1);

        // 确定滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY) * config.touchSensitivity) {
            const newDirection = deltaX > threshold ? 'right' : deltaX < -threshold ? 'left' : null;
            if (newDirection && newDirection !== lastDirection) {
                handleTouch(newDirection);
                lastDirection = newDirection;
            }
        } else if (Math.abs(deltaY) > Math.abs(deltaX) * config.touchSensitivity) {
            const newDirection = deltaY > threshold ? 'down' : deltaY < -threshold ? 'up' : null;
            if (newDirection && newDirection !== lastDirection) {
                handleTouch(newDirection);
                lastDirection = newDirection;
            }
        }
    });

    // 阻止默认的滚动行为
    document.addEventListener('touchmove', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });

    // 适配移动端画布大小
    function resizeCanvas() {
        const container = canvas.parentElement;
        const maxSize = Math.min(container.clientWidth, window.innerHeight * 0.5);
        canvas.style.width = maxSize + 'px';
        canvas.style.height = maxSize + 'px';
    }

    // 监听屏幕旋转和调整大小
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    resizeCanvas();
}

// 键盘控制
document.addEventListener("keydown", (event) => {
    if (gameState.paused && event.key !== "p") return;

    switch (event.key) {
        case "ArrowUp":
        case "w":
            if (gameState.direction !== "down") {
                gameState.nextDirection = "up";
            }
            break;
        case "ArrowDown":
        case "s":
            if (gameState.direction !== "up") {
                gameState.nextDirection = "down";
            }
            break;
        case "ArrowLeft":
        case "a":
            if (gameState.direction !== "right") {
                gameState.nextDirection = "left";
            }
            break;
        case "ArrowRight":
        case "d":
            if (gameState.direction !== "left") {
                gameState.nextDirection = "right";
            }
            break;
        case "p":
            gameState.paused = !gameState.paused;
            break;
    }
});

// 修改初始化函数
window.onload = () => {
    loadGameData();
    initTouchControls();
    showScreen("mainMenu");
}; 