<script lang="ts">
	// Port of stories/Drawer/Recipes: CreateProject (title "Patterns & Recipes/Drawer/Recipes"): "create project" form in a right drawer
	// (inputs, textarea, two InputDate, directions with Select + Multiselect).
	import './_recipe-create-project.css';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import Input from '$lib/components/Input/Input.svelte';
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import AddSmall from '$lib/icons/24/action/AddSmall.svelte';
	import Trash from '$lib/icons/24/action/Trash.svelte';

	interface Technology {
		id: string;
		name: string;
	}
	interface Direction {
		id: string | number;
		name: string;
		technologies: Technology[];
	}
	interface ProjectDirection extends Direction {
		directionId?: Direction['id'];
	}
	interface Project {
		name: string;
		description: string;
		startDate: Date | undefined;
		endDate: Date | undefined;
		owner: string;
		directions: ProjectDirection[];
	}

	let isDrawerOpen = $state(false);
	let project = $state.raw<Project>({ name: '', description: '', startDate: undefined, endDate: undefined, owner: '', directions: [] });

	const directions: Direction[] = [
		{ id: '1', name: 'Frontend', technologies: [{ id: '1', name: 'Vue.js' }, { id: '2', name: 'React' }] },
		{ id: '2', name: 'Backend', technologies: [{ id: '1', name: 'Node.js' }, { id: '2', name: 'Python' }] },
		{ id: '3', name: 'Mobile', technologies: [{ id: '1', name: 'React Native' }, { id: '2', name: 'Swift' }] }
	];

	// React `setProject(prev => ...)`
	const update = (fn: (prev: Project) => Project) => {
		project = fn(project);
	};

	const handleDirectionChange = (direction: Direction['id'], directionId: Direction['id']) => {
		const tmpDirection = directions.find((d) => d.id === direction);
		const emptyDirectionIdx = project.directions.findIndex((d) => !d.id);
		const existDirectionIdx = project.directions.findIndex((d) => d.id === directionId);
		if (~emptyDirectionIdx) {
			update((prev) => ({
				...prev,
				directions: prev.directions.map((d, idx) =>
					idx === emptyDirectionIdx ? { id: Date.now(), directionId: tmpDirection?.id, name: tmpDirection!.name, technologies: [] } : d
				)
			}));
		}
		if (~existDirectionIdx) {
			update((prev) => ({
				...prev,
				directions: prev.directions.map((d, idx) =>
					idx === existDirectionIdx ? { id: Date.now(), directionId: tmpDirection?.id, name: tmpDirection!.name, technologies: [] } : d
				)
			}));
		}
	};

	const addDirection = () => {
		update((prev) => ({
			...prev,
			directions: [...prev.directions, { id: prev.directions.length.toString(), directionId: '', name: '', technologies: [] }]
		}));
	};

	const removeDirection = (id: string | number) => {
		update((prev) => ({ ...prev, directions: prev.directions.filter((d) => d.id !== id) }));
	};

	const updateTechnologies = (directionId: string | number, technologies: DropdownMenuItem[]) => {
		update((prev) => ({
			...prev,
			directions: prev.directions.map((d) => {
				if (d.id === directionId) {
					return {
						...d,
						technologies: technologies.map((technology) => {
							const tech = directions.find((dir) => dir.id === directionId)?.technologies.find((t) => t.id === technology.key);
							return tech || { id: String(technology.key), name: '' };
						})
					};
				}
				return d;
			})
		}));
	};

	const handleCreate = () => {
		console.log(project);
	};
	const handleClose = () => {
		isDrawerOpen = false;
	};
	const handleOpen = () => {
		isDrawerOpen = true;
	};
</script>

{#snippet trash()}<Trash />{/snippet}
{#snippet addSmall()}<AddSmall />{/snippet}

<Button onclick={handleOpen} label="Открыть Drawer" />

<Drawer class="create-project-drawer" isOpened={isDrawerOpen} onClickOverlay={handleClose}>
	<div class="atmr-drawer__header">
		<Typography variant="heading-h1" as="h1">Создание проекта</Typography>
		<div class="atmr-drawer__actions">
			<CloseButton onclick={handleClose} aria-label="Close" />
		</div>
	</div>

	<div class="atmr-drawer__body project-info">
		<Box tag="form" class="form" flex flexDirection="column" gapY="var(--atmr-spacing-4x)">
			<Typography variant="heading-h4" as="h4">Информация о проекте</Typography>
			<Input
				value={project.name}
				onChange={(e) => update((prev) => ({ ...prev, name: e.target.value }))}
				label="Название проекта"
				size="l"
				placeholder="Введите название проекта"
			/>
			<TextArea
				value={project.description}
				onChange={(e) => update((prev) => ({ ...prev, description: e.target.value }))}
				label="Описание проекта"
				size="l"
				placeholder="Введите описание проекта"
			/>
			<Input
				value={project.owner}
				onChange={(e) => update((prev) => ({ ...prev, owner: e.target.value }))}
				label="Руководитель"
				size="l"
				placeholder="Введите название проекта"
			/>
			<Box class="project-info__dates" flex gapX="var(--atmr-spacing-3x)">
				<Box flex flexGrow="1" flexShrink="1" flexBasis="0">
					<InputDate activeDate={project.startDate} onChange={(date) => update((prev) => ({ ...prev, startDate: date }))} label="Дата начала" size="l" />
				</Box>
				<Box flex flexGrow="1" flexShrink="1" flexBasis="0">
					<InputDate activeDate={project.endDate} onChange={(date) => update((prev) => ({ ...prev, endDate: date }))} label="Дата окончания" size="l" />
				</Box>
			</Box>
			<Typography variant="heading-h4" as="h4">Технологии</Typography>
			{#each project.directions as direction (direction.id)}
				<Box class="project-info__technologies" flex gapX="var(--atmr-spacing-3x)">
					<Box flex flexGrow="0" flexShrink="0" flexBasis="50%">
						<Select
							label="Технология"
							size="l"
							value={direction.directionId}
							onChange={(id) => handleDirectionChange(id, direction.id)}
							useInPortal={false}
							items={directions.map((d) => ({ value: d.name, key: d.id }))}
						/>
					</Box>
					<Box flex flexGrow="0" flexShrink="0" flexBasis="50%" alignItems="center">
						<Multiselect
							label="Технология"
							size="l"
							useInPortal={false}
							items={directions.find((d) => d.id === direction.directionId)?.technologies.map((t) => ({ value: t.name, key: t.id }))}
							value={project.directions.find((d) => d.id === direction.id)?.technologies.map((t) => ({ key: t.id, value: t.name }))}
							onChange={(value) => updateTechnologies(direction.id, value)}
						/>
						<IconButton size="l" variant="ghost" colorScheme="neutral" onclick={() => removeDirection(direction.id)} icon={trash} />
					</Box>
				</Box>
			{/each}
			<FunctionButton label="Добавить направление" class="project-info__add-direction" variant="primary" onclick={addDirection} icon={addSmall} />
		</Box>
	</div>

	<div class="atmr-drawer__footer">
		<Button size="l" onclick={handleCreate} label="Создать" />
		<Button colorScheme="neutral" label="Отмена" onclick={handleClose} variant="outline" size="l" />
	</div>
</Drawer>
