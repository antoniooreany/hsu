import { Camera } from '../camera.js';
import { Sprite } from '../sprite.js';
import { Story } from '../story.js';
import { Render } from './render.js';
import { Elements } from './elements.js';
import { AreasLayer } from './areas-layer.js';

export const CharactersLayer = {
  initialize({
    charactersCanvas, characters = [], viewport, canvasWidth, canvasHeight, panel, player, sprites,
  }) {
    const characterPane = panel.querySelector('#character-pane');
    let selected;
    let stat;
    const args = {
      width: canvasWidth,
      height: canvasHeight,
      canvas: charactersCanvas,
      context: charactersCanvas.getContext('2d'),
      player,
      sprites,
    };

    function changeCharacters(change) {
      switch (change.type) {
        case 'update-character':
          updateCharacters(characters.map((t) => { // eslint-disable-line
            if (t.id !== change.id) { return t; }
            if (change.prop2 != null) {
              return { ...t, [change.prop]: change.value, [change.prop2]: change.value2 };
            }
            return { ...t, [change.prop]: change.value };
          }));
          break;
        case 'delete-character':
          updateCharacters(characters.filter((t) => { // eslint-disable-line
            if (t.id !== change.id) { return true; }
            return false;
          }));
          break;
        default:
          throw Error('Unknown Change Type');
      }
    }
    const pad = 5;
    function updateCharacters(newCharacters) {
      characters = newCharacters; // eslint-disable-line
      if (selected && selected) {
        selected = characters.find((t) => t.id === selected.id);
      }
      CharactersLayer.drawAll({ ...args, characters, selected, viewport, pad });
      CharactersLayer.renderCharacterPane({
        characterPane, characters, changeCharacters, sprites, player, selected,
      });
    }
    CharactersLayer.renderCharacterPane({
      characterPane, characters, changeCharacters, sprites, player, selected,
    });

    charactersCanvas.addEventListener('mousedown', (e) => {
      const x = (e.offsetX / viewport.scale + viewport.x);
      const y = (e.offsetY / viewport.scale + viewport.y);
      selected = AreasLayer.inArea({ areas: characters, x, y });
      stat = 'move';
      if (!selected) {
        const id = Story.newId(characters);
        selected = { ...CharactersLayer.newCharacter(id, player), x, y };
      }

      // Update characters
      if (selected) {
        updateCharacters(characters.filter((t) => t !== selected).concat(selected));
      }
    });
    charactersCanvas.addEventListener('mousemove', (e) => {
      if (selected && stat === 'move') {
        const updatedCharacters = characters.filter((t) => t !== selected);
        selected = {
          ...selected,
          x: selected.x + e.movementX / viewport.scale,
          y: selected.y + e.movementY / viewport.scale,
        };
        updateCharacters(updatedCharacters.concat(selected));
      }
    });

    function done() {
      // Something selected and we're doing something
      if (selected && stat != null) {
        const updatedCharacters = characters.filter((t) => t !== selected);
        updateCharacters(updatedCharacters.concat(selected));
      }
      stat = null;
    }
    charactersCanvas.addEventListener('mouseup', done);
    charactersCanvas.addEventListener('mouseout', done);

    return {
      updateCharacters,
      updateViewport(newViewport) {
        viewport = newViewport; // eslint-disable-line
        CharactersLayer.drawAll({ ...args, characters, selected, viewport, pad });
      },
      getCharacters() { return characters; },
    };
  },

  newCharacter(id, example) {
    return {
      id,
      x: 0,
      y: 0,
      spriteIndex: 12,
      width: example.width,
      height: example.height,
      speed: example.speed,
      name: CharactersLayer.newName(id),
    };
  },

  drawAll({
    context,
    characters,
    width,
    height,
    selected,
    viewport,
    sprites,
    player,
    pad,
  }) {
    Camera.drawScene({
      player,
      characters,
      context,
      width,
      height,
      sprites,
      layoutContext: null,
      oldViewport: viewport, // Hack to not draw the background
      viewport,
      drawActorToContext: Sprite.drawActorToContext,
    });
    characters.forEach((character) => {
      context.strokeStyle = ((selected && selected.id) === character.id) ? 'red' : 'black';
      context.strokeRect(
        (character.x - viewport.x - pad) * viewport.scale,
        (character.y - viewport.y - pad) * viewport.scale,
        (character.width + 2 * pad) * viewport.scale,
        (character.height + 2 * pad) * viewport.scale,
      );
    });
  },

  newName(id) {
    return `name${id}`;
  },
  createSmallerCanvas(canvas, spritePart) {
    const newCanvas = Elements.create('canvas');
    Camera.setCanvasResolution(newCanvas, spritePart.width, spritePart.height);
    const ctx = canvas.getContext('2d');
    const newCtx = newCanvas.getContext('2d');
    const imageData = ctx.getImageData(
      spritePart.x,
      spritePart.y,
      spritePart.width,
      spritePart.height,
    );
    newCtx.putImageData(imageData, 0, 0);
    return newCanvas;
  },
  createSpritePicker({ sprite, selected, changeCharacters, name }) {
    return Elements.wrap(
      Elements.create('div', { class: 'character-options' }),
      sprite.parts.map((t, index) => {
        const smallCanvas = CharactersLayer.createSmallerCanvas(sprite.canvas, t);
        const selectedSpriteName = selected && (selected.spriteName || 'characterSprite');
        if (selected && selected.spriteIndex === index && selectedSpriteName === name) {
          smallCanvas.setAttribute('class', 'selected');
        }
        Render.registerEvent(smallCanvas, 'click', () => {
          if (!selected) { return; }
          if (selectedSpriteName !== name) {
            changeCharacters({
              type: 'update-character',
              id: selected.id,
              prop: 'spriteName',
              value: name,
              prop2: 'spriteIndex',
              value2: index,
            });
            return;
          }
          changeCharacters({ type: 'update-character', id: selected.id, prop: 'spriteIndex', value: index });
        });
        return smallCanvas;
      }),
    );
  },
  renderCharacterPane({ characterPane, characters, changeCharacters, sprites, player, selected }) {
    const ul = Elements.create('ul');
    const content = [
      Elements.wrap('h2', 'Characters'),
      CharactersLayer.createSpritePicker({
        sprite: sprites.characterSprite[player.width * 2],
        name: 'characterSprite',
        selected,
        changeCharacters,
      }),
      CharactersLayer.createSpritePicker({
        sprite: sprites.uniqueCharacterSprite[player.width * 2],
        name: 'uniqueCharacterSprite',
        selected,
        changeCharacters,
      }),
      ul,
    ];
    for (let i = 0; i < characters.length; i++) {
      const c = characters[i];

      const nameEl = Elements.create('input', { type: 'text', value: c.name });
      Render.registerEvent(nameEl, 'change', (e) => {
        changeCharacters({ type: 'update-character', id: c.id, prop: 'name', value: e.target.value });
      });
      const del = Elements.create('input', { type: 'button', value: 'x' });
      Render.registerEvent(del, 'click', () => { changeCharacters({ type: 'delete-character', id: c.id }); });

      const item = Elements.wrap('li', [Elements.wrap('div', `${c.id}`), nameEl, del]);
      ul.appendChild(item);
    }
    Render.renderToEl(characterPane, content);
  },
};
