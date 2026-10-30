
function calculateRetirement() {
    const currentAge = Number(
        document.getElementById("currentAge").value
    );
    const retirementAge = Number(
        document.getElementById("retirementAge").value
    );
    const lifeExpectancy = Number(
        document.getElementById("lifeExpectancy").value
    );
    const annualIncome = Number(
        document.getElementById("annualIncome").value
    );

    const investmentReturn =
    Number(document.getElementById("investmentReturn").value) / 100;
    const inflation =
    Number(document.getElementById("inflationRate").value) / 100;

    if (
        !Number.isInteger(currentAge) ||
        !Number.isInteger(retirementAge) ||
        !Number.isInteger(lifeExpectancy) ||
        currentAge < 0 ||
        retirementAge <= currentAge ||
        lifeExpectancy <= retirementAge ||
        !Number.isFinite(annualIncome) ||
        annualIncome <= 0
    ) {
        alert("Please enter valid ages and a positive annual income.");
        return;
    }

    const yearsUntilRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;

    const firstYearIncome =
        annualIncome * Math.pow(1 + inflation, yearsUntilRetirement);

    
    const strategy = document.querySelector(
        'input[name="strategy"]:checked'
    ).value;

let requiredSavings = 0;

if (strategy === "drawdown") {

    // Withdraw both earnings and capital.
    // Withdrawals occur at the beginning of each year.
    for (let year = yearsInRetirement - 1; year >= 0; year--) {
        const withdrawal =
            firstYearIncome * Math.pow(1 + inflation, year);

        requiredSavings =
            withdrawal + requiredSavings / (1 + investmentReturn);
    }

} else if (strategy === "preserve") {

    // Preserve the original nominal capital at the
    // end of retirement, after funding all withdrawals.
    // A constant annual return is assumed.
    const withdrawals = [];

    for (let year = 0; year < yearsInRetirement; year++) {
        withdrawals.push(
            firstYearIncome * Math.pow(1 + inflation, year)
        );
    }

    let presentValueWithdrawals = 0;

    for (let year = 0; year < yearsInRetirement; year++) {
        presentValueWithdrawals +=
            withdrawals[year] /
            Math.pow(1 + investmentReturn, year);
    }

    const discountFactor =
        Math.pow(1 + investmentReturn, -yearsInRetirement);

    requiredSavings =
        presentValueWithdrawals / (1 - discountFactor);
}


    const formattedSavings = requiredSavings.toLocaleString("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0
    });

    
document.getElementById("result").textContent =
    formattedSavings;

document.getElementById("resultAge").textContent =
    "Estimated amount required at age " + retirementAge;

document.getElementById("yearsUntil").textContent =
    yearsUntilRetirement + " years";

document.getElementById("yearsRetired").textContent =
    yearsInRetirement + " years";

document.getElementById("displayReturn").textContent =
    (investmentReturn * 100).toFixed(1) + "% p.a.";

document.getElementById("displayInflation").textContent =
    (inflation * 100).toFixed(1) + "% p.a.";
document.getElementById("displayStrategy").textContent =
    strategy === "drawdown"
        ? "Draw Down Capital"
        : "Preserve Capital";
document.getElementById("resultsPanel").hidden = false;
document.querySelector(
    `input[name="chartStrategy"][value="${strategy}"]`
).checked = true;
buildRetirementChart();

}

const returnSlider = document.getElementById("investmentReturn");
const inflationSlider = document.getElementById("inflationRate");

returnSlider.addEventListener("input", function () {
    document.getElementById("returnValue").textContent =
        this.value + "%";
});

inflationSlider.addEventListener("input", function () {
    document.getElementById("inflationValue").textContent =
        this.value + "%";
});

function buildRetirementChart() {
    const currentAge = Number(
        document.getElementById("currentAge").value
    );
    const retirementAge = Number(
        document.getElementById("retirementAge").value
    );
    const lifeExpectancy = Number(
        document.getElementById("lifeExpectancy").value
    );
    const annualIncome = Number(
        document.getElementById("annualIncome").value
    );
    const r = Number(
        document.getElementById("investmentReturn").value
    ) / 100;
    const inflation = Number(
        document.getElementById("inflationRate").value
    ) / 100;

    const years = lifeExpectancy - retirementAge;

    if (!Number.isInteger(years) || years <= 0 ||
        retirementAge <= currentAge ||
        annualIncome <= 0 || r <= 0) return;

    const firstWithdrawal = annualIncome *
        Math.pow(1 + inflation, retirementAge - currentAge);

    const withdrawals = Array.from(
        {length: years},
        (_, i) => firstWithdrawal * Math.pow(1 + inflation, i)
    );

    // Starting balance for capital drawdown.
    const drawdownStart = withdrawals.reduce(
        (total, amount, i) =>
            total + amount / Math.pow(1 + r, i),
        0
    );

    // Starting balance for nominal capital preservation.
    const preserveStart = drawdownStart /
        (1 - Math.pow(1 + r, -years));

    
    function project(startBalance) {
        let balance = startBalance;

        const points = [{
            age: retirementAge,
            balance: balance,
            withdrawal: 0,
            earnings: 0
        }];

        withdrawals.forEach((withdrawal, i) => {
            const openingBalance = balance;

            // Withdrawal occurs at the beginning of the year.
            const balanceAfterWithdrawal =
                openingBalance - withdrawal;

            // Calculate investment earnings.
            const earnings = balanceAfterWithdrawal * r;

            // Calculate remaining balance.
            balance = balanceAfterWithdrawal + earnings;

            points.push({
                age: retirementAge + i + 1,
                balance: balance,
                withdrawal: withdrawal,
                earnings: earnings
            });
        });

        return points;
    }

    const drawdown = project(drawdownStart);
    const preserve = project(preserveStart);

    const selected = document.querySelector(
        'input[name="chartStrategy"]:checked'
    ).value;

    const svg = document.getElementById("retirementChart");
    const maxBalance = Math.max(
        ...drawdown.map(p => p.balance),
        ...preserve.map(p => p.balance)
    ) * 1.1;

    const left = 75;
    const right = 615;
    const top = 20;
    const bottom = 275;

    const x = age => left +
        (age - retirementAge) / years * (right - left);

    const y = balance => bottom -
        balance / maxBalance * (bottom - top);

    const line = points => points.map(
        p => `${x(p.age)},${y(Math.max(0, p.balance))}`
    ).join(" ");

    let markup = "";

    // Horizontal grid lines and dollar labels.
    for (let i = 0; i <= 4; i++) {
        const amount = maxBalance * i / 4;
        const yy = y(amount);

        markup += `
            <line x1="${left}" y1="${yy}"
                  x2="${right}" y2="${yy}"
                  stroke="#dce5ef" />
            <text class="chart-axis-label"
                  x="${left - 10}" y="${yy + 4}"
                  text-anchor="end"
                  font-size="12" fill="#64748b">
                $${(amount / 1000000).toFixed(1)}m
            </text>
        `;
    }

    // Age labels.
    for (let i = 0; i <= 5; i++) {
        const age = retirementAge + years * i / 5;
        markup += `
            <text class="chart-axis-label"
                  x="${x(age)}" y="300"
                  text-anchor="middle"
                  font-size="12" fill="#64748b">
                ${Math.round(age)}
            </text>
        `;
    }

    // Both strategy lines remain visible.
    markup += `
        <polyline points="${line(drawdown)}"
            fill="none" stroke="#1479c9"
            stroke-width="${selected === "drawdown" ? 4 : 2}"
            opacity="${selected === "drawdown" ? 1 : 0.25}"
            stroke-linejoin="round" />

        <polyline points="${line(preserve)}"
            fill="none" stroke="#15a17e"
            stroke-width="${selected === "preserve" ? 4 : 2}"
            opacity="${selected === "preserve" ? 1 : 0.25}"
            stroke-linejoin="round" />
    `;

    svg.innerHTML = markup;

    const selectedStart = selected === "drawdown"
        ? drawdownStart : preserveStart;

    const selectedPoints = selected === "drawdown"
        ? drawdown : preserve;

    const endingBalance = Math.max(
        0, selectedPoints[selectedPoints.length - 1].balance
    );

    const money = value => value.toLocaleString("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0
    });

    document.getElementById("chartStarting").textContent =
        money(selectedStart);

    document.getElementById("chartEnding").textContent =
        money(endingBalance);
    
    // Interactive chart details for hover, click and tap.
    const tooltip = document.getElementById("chartTooltip");

    function showYearDetails(index) {
        const point = selectedPoints[index];

        if (!point || !tooltip) return;
        updateMarker(index);

        document.getElementById("tooltipAge").textContent =
            index === 0
                ? `Starting balance at age ${point.age}`
                : `Retirement year: age ${point.age - 1} to ${point.age}`;

        document.getElementById("tooltipWithdrawal").textContent =
            money(point.withdrawal);

        document.getElementById("tooltipEarnings").textContent =
            money(point.earnings);

        document.getElementById("tooltipBalance").textContent =
            money(Math.max(0, point.balance));

        tooltip.hidden = false;
    }

    // Create invisible interactive points along the selected curve.
    selectedPoints.forEach((point, index) => {
        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("cx", x(point.age));
        circle.setAttribute("cy", y(Math.max(0, point.balance)));
        circle.setAttribute("r", "12");
        circle.setAttribute("fill", "transparent");
        circle.setAttribute("tabindex", "0");
        circle.style.outline = "none";
        circle.setAttribute(
            "aria-label",
            `Show retirement details at age ${point.age}`
        );

        circle.style.cursor = "pointer";

        circle.addEventListener("mouseenter", () => {
            showYearDetails(index);
        });

        circle.addEventListener("click", () => {
            showYearDetails(index);
        });

        circle.addEventListener("focus", () => {
            showYearDetails(index);
        });

        svg.appendChild(circle);
    });
    
    // Colored marker for the selected retirement year.
    const activeMarker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
    );

    activeMarker.setAttribute("r", "7");
    activeMarker.setAttribute(
        "fill",
        selected === "drawdown" ? "#1479c9" : "#15a17e"
    );
    activeMarker.setAttribute("stroke", "#ffffff");
    activeMarker.setAttribute("stroke-width", "2");
    activeMarker.setAttribute("pointer-events", "none");

    svg.appendChild(activeMarker);

    function updateMarker(index) {
        const point = selectedPoints[index];
        if (!point) return;

        activeMarker.setAttribute("cx", x(point.age));
        activeMarker.setAttribute(
            "cy",
            y(Math.max(0, point.balance))
        );
    }

    // Display the first retirement year's details by default.
    showYearDetails(1);
    
}

// Synchronize chart selection with the calculator strategy.
document.querySelectorAll(
    'input[name="chartStrategy"]'
).forEach(radio => {
    radio.addEventListener("change", function () {
        const mainRadio = document.querySelector(
            `input[name="strategy"][value="${this.value}"]`
        );

        mainRadio.checked = true;
        calculateRetirement();
    });
});
