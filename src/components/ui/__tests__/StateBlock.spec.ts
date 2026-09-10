import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import StateBlock from '@/components/ui/StateBlock.vue'

type Props = InstanceType<typeof StateBlock>['$props']

function mountState(props: Props) {
  return mount(StateBlock, { props, global: { plugins: testPlugins() } })
}

describe('StateBlock', () => {
  it('shows the title', () => {
    expect(mountState({ title: 'Your list is empty.' }).get('[data-test="state-div"]').text())
      .toContain('Your list is empty.')
  })

  it('shows the hint when there is one', () => {
    const wrapper = mountState({ title: 'Your list is empty.', hint: 'Add a show with the + button.' })

    expect(wrapper.text()).toContain('Add a show with the + button.')
  })

  it('leaves out the hint when there is none', () => {
    expect(mountState({ title: 'Empty' }).find('.state__hint').exists()).toBe(false)
  })

  it('uses the data-test name it is given', () => {
    expect(mountState({ title: 'Empty', test: 'home-empty' }).find('[data-test="home-empty"]').exists()).toBe(true)
  })

  it('has no retry button by default', () => {
    expect(mountState({ title: 'Empty' }).find('[data-test="state-retry-btn"]').exists()).toBe(false)
  })

  it('offers a retry button labelled "Try again"', () => {
    expect(mountState({ title: 'Something went wrong', retry: true }).get('[data-test="state-retry-btn"]').text())
      .toBe('Try again')
  })

  it('uses a custom action label when it is given', () => {
    const wrapper = mountState({ title: 'More', retry: true, actionLabel: 'Load more' })

    expect(wrapper.get('[data-test="state-retry-btn"]').text()).toBe('Load more')
  })

  it('asks the page to retry when the button is pressed', async () => {
    const wrapper = mountState({ title: 'Something went wrong', retry: true })

    await wrapper.get('[data-test="state-retry-btn"]').trigger('click')

    expect(wrapper.emitted('on-retry')).toHaveLength(1)
  })

  it('marks an error variant', () => {
    expect(mountState({ title: 'Boom', variant: 'error' }).get('[data-test="state-div"]').classes())
      .toContain('state--error')
  })
})
