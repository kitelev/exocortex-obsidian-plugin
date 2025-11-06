export const select = jest.fn(() => ({
  selectAll: jest.fn(() => ({ remove: jest.fn() })),
  attr: jest.fn(() => ({ attr: jest.fn() })),
  append: jest.fn(() => ({
    attr: jest.fn(() => ({ attr: jest.fn() })),
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        join: jest.fn(() => ({
          attr: jest.fn(() => ({ attr: jest.fn() })),
          text: jest.fn(),
          on: jest.fn(),
          call: jest.fn(),
        })),
      })),
    })),
  })),
  call: jest.fn(),
}));

export const zoom = jest.fn(() => ({
  scaleExtent: jest.fn(() => ({ on: jest.fn() })),
}));

export const forceSimulation = jest.fn(() => ({
  force: jest.fn(() => ({ force: jest.fn() })),
  on: jest.fn(),
  stop: jest.fn(),
  alphaTarget: jest.fn(() => ({ restart: jest.fn() })),
}));

export const forceLink = jest.fn(() => ({
  id: jest.fn(() => ({ distance: jest.fn() })),
}));

export const forceManyBody = jest.fn(() => ({
  strength: jest.fn(),
}));

export const forceCenter = jest.fn();

export const forceCollide = jest.fn(() => ({
  radius: jest.fn(),
}));

export const drag = jest.fn(() => ({
  on: jest.fn(() => ({ on: jest.fn(() => ({ on: jest.fn() })) })),
}));
