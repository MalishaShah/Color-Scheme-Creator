<!--Trying to gain familiarity with different svelte components and features with color scheme creator-->
<script>
	//Reactive statement used to update full name 
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

	//updates value of activeId when passed in id element
	const updateId = (id) => {
		activeId = id;
	}
	
	//Removes button and delete button of a color block
	const deleteClick = (id) => {
		colors = colors.filter(color => color.id !== id);
		for(let i = 0; i < colors.length; i++){
			colors[i].id = i;
		}
		colors = colors;
		console.log(colors);
	};
	
	//Add new color block
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
	
	<!--Fun feature to change color of texts to the user's favorite color-->
	<p style="color: {favColor}">What is your favorite color?</p>
	<input type="text" bind:value={favColor}>

	<!--Use a form to input numbers of RGB values. New challenge is to make a slider-->
	<!--RGB numbers displayed for the active block(last clicked block)-->
	<ul>
		<li>R: <input type="number" min="0" max="255" bind:value={colors[activeId].red}></li>
		<li>G: <input type="number" min="0" max="255" bind:value={colors[activeId].green}></li>
		<li>B: <input type="number" min="0" max="255" bind:value={colors[activeId].blue}></li>
	</ul>
	
	<!--Using a loop to create the color blocks and corresponding buttons-->
	<div class="blocks">
		{#each colors as color}
			<div class = "contain">
			<!--On click handler to set certain block as the one that is now being controlled by the RGB numbers-->
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
