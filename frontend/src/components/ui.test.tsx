import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { Pagination } from '../components/ui/Pagination'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('btn-danger')
  })

  it('applies size classes', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('btn-sm')
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toContainHTML('loading-spinner')
  })

  it('calls onClick handler', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('Input', () => {
  it('renders label and input', () => {
    render(<Input label="Email" placeholder="Enter email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows helper text', () => {
    render(<Input label="Password" helperText="Min 8 characters" />)
    expect(screen.getByText('Min 8 characters')).toBeInTheDocument()
  })
})

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test Modal">Content</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test Modal">Content</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on overlay click', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>)
    const overlay = document.querySelector('.modal-overlay') as HTMLElement
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close on content click', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>)
    fireEvent.click(screen.getByText('Content'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('Table', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ]
  const data = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' },
  ]

  it('renders table with headers and data', () => {
    render(<Table columns={columns} data={data} keyExtractor={d => d.id} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
  })

  it('shows empty message when no data', () => {
    const emptyColumns = [
      { key: 'name', header: 'Name' },
    ]
    render(<Table columns={emptyColumns} data={[]} keyExtractor={d => (d as {id: number}).id} emptyMessage="No items" />)
    expect(screen.getByText('No items')).toBeInTheDocument()
  })
  it('calls rowClick on row click', () => {
    const onRowClick = vi.fn()
    render(<Table columns={columns} data={data} keyExtractor={d => d.id} rowClick={onRowClick} />)
    fireEvent.click(screen.getByText('John'))
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it('uses custom render function', () => {
    const columnsWithRender = [
      { key: 'name', header: 'Name', render: (d: {name: string}) => <strong>{d.name}</strong> },
    ]
    render(<Table columns={columnsWithRender} data={data} keyExtractor={d => d.id} />)
    expect(screen.getByText('John').parentElement).toHaveTextContent('John')
  })
})

describe('Pagination', () => {
  it('renders pagination controls', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    expect(screen.getByLabelText('Next page')).not.toBeDisabled()
  })

  it('highlights current page', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('3')).toHaveClass('active')
  })

  it('calls onPageChange when page clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('does not render when only one page', () => {
    render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})