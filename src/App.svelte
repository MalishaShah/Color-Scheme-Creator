<script>
	let firstName = "Malisha";
	let lastName = "Shah";
	$: fullName = `${firstName} ${lastName}`;
	
	let favColor = 'Red';
	const changeColor = () => {
		favColor = 'Purple';
	};
	let red = 0;
	let green = 0;
	let blue = 0;
	
	//Access value of input
	const handleInput = (param) => {
		favColor = param.target.value;
	};
</script>

<main>
	<h2 style="color: {favColor}">Color Schemer</h2>
	<p style="color: {favColor}">What is your favorite color?</p>
	<!--Challenge: Create an RBG Color Selector-->
	<input type="text" bind:value={favColor}>
	<ul>
		<li>R: <input type="number" min="0" max="255" bind:value={red}></li>
		<li>G: <input type="number" min="0" max="255" bind:value={green}></li>
		<li>B: <input type="number" min="0" max="255" bind:value={blue}></li>
	</ul>
	<div class="colors">
		<div class="color" style="background:rgb({red},{green},{blue})"></div>
	</div>
	<footer>
		<p id="message">Created by {fullName}</p>
	</footer>

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h2 {
		color: #ff3e00;
		font-size: 3em;
		font-weight: 100;
		text-transform: uppercase;
	}

	li{
		text-decoration: none;
		display: inline-block
	}

	div {
		width: 300px;
		height: 300px;
		margin: 0 auto;
	}

	footer {
		text-transform: uppercase;
		padding: 0 10px;
		margin: 30px 0;
		background-color: #0D2C40;
		color: white;
		font-size: 14px;
		letter-spacing: 0.08em;
		font-weight: 500;
	}

	#message {
		text-align: right;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>