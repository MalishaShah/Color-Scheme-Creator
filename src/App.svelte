<script>
	let firstName = "Malisha";
	let lastName = "Shah";
	$: fullName = `${firstName} ${lastName}`;
		
	let favColor = 'Black';

	//Changes color of paragraph and header text
	const handleInput = (param) => {
		favColor = param.target.value;
	};
	
	let colors = [{red: 0, green: 0, blue: 0, id: 0}];
	//Keeps track of the most most recent clicked block
	let activeId = 0;


	const updateId = (id) => {
		activeId = id;
	}
	const deleteClick = (id) => {
		colors = colors.filter(color => color.id !== id);
		for(let i = 0; i < colors.length; i++){
			colors[i].id = i;
		}
		colors = colors;
		console.log(colors);
	};
	const newBlock = () => {
		let id = colors.length;
		let color = {
			red: 0,
			green: 0,
			blue: 0,
			id
		}
		colors = [...colors, color];
		console.log(colors);
	};
</script>

<main>
	<h2 style="color: {favColor}">Color Schemer</h2>
	<p style="color: {favColor}">What is your favorite color?</p>
	<!--Challenge: Create an RBG Color Selector-->
	<input type="text" bind:value={favColor}>

	<ul>
		<li>R: <input type="number" min="0" max="255" bind:value={colors[activeId].red}></li>
		<li>G: <input type="number" min="0" max="255" bind:value={colors[activeId].green}></li>
		<li>B: <input type="number" min="0" max="255" bind:value={colors[activeId].blue}></li>
	</ul>
	<div class="blocks">
		{#each colors as color}
			<div class = "contain">
			<div on:click={updateId(color.id)} class="block" style="background:rgb({color.red},{color.green},{color.blue})"></div>
				<button class="delete" on:click={() => deleteClick(color.id)}>Delete</button>
			</div>
		{/each}
	</div>
  <button on:click={newBlock}>Add a color block</button>
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
	.blocks{
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		width: 90%;
		margin: 0 auto;
	}
	.block {
		max-width: 300px;
		max-height: 300px;
		min-width: 120px;
		min-height: 120px;
		margin: 10px;
	}

	.block:active {
		border: red solid 2px;
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
