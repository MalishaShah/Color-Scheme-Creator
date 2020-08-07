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
		if(id === activeId){
			activeId = undefined;
		}
		else if(id < activeId){
			activeId--;
		}
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
		activeId = id;
	};
</script>

<main>
	<h2 style="color: {favColor}">Color Schemer</h2>
	
	<!--Fun feature to change color of texts to the user's favorite color-->
	<p style="color: {favColor}">What is your favorite color?</p>
	<input type="text" bind:value={favColor}>

	<!--Use a form to input numbers of RGB values. New challenge is to make a slider-->
	<!--RGB numbers displayed for the active block(last clicked block)-->
	<!--If active block was deleted, values are reset to 0 until new block is selected-->
	<ul>
		{#if activeId != undefined} 
			<li>R: <input type="number" min="0" max="255" bind:value={colors[activeId].red}></li>
			<li>G: <input type="number" min="0" max="255" bind:value={colors[activeId].green}></li>
			<li>B: <input type="number" min="0" max="255" bind:value={colors[activeId].blue}></li>
		{:else}
			<li>R: <input type="number" min="0" max="0" value=0></li>
			<li>G: <input type="number" min="0" max="0" value=0></li>
			<li>B: <input type="number" min="0" max="0" value=0></li>
		{/if}
	</ul>
	
	
	<!--Using a loop to create the color blocks and corresponding buttons-->
	<div class="blocks">
		{#each colors as color}
			<div class = "contain">
			<!--On click handler to set certain block as the one that is now being controlled by the RGB numbers-->
			<!--current class to customize CSS properties for active block-->
			<div on:click={updateId(color.id)} 
				class="block" style="background:rgb({color.red},{color.green},{color.blue})"
				class:current="{color.id === activeId}"></div>
				<button class="delete" on:click={() => deleteClick(color.id)}>Delete</button>
			</div>
		{/each}
	</div>
  	<button 
	  on:click={newBlock}>Add a color block</button>
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

	.current {
		border: red solid 3px;
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
