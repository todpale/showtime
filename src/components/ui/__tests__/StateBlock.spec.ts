import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import StateBlock from '@/components/ui/StateBlock.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

type Props = InstanceType<typeof StateBlock>['$props']

let wrapper: VueWrapper<any>

function mountWrapper(props: Props) {
  return mount(StateBlock, { props, global: { plugins: testPlugins() } })
}

describe('StateBlock', () => {
  it('shows the title', () => {
    wrapper = mountWrapper({ title: 'Your list is empty.' })
    expect(wrapper.get('[data-test="state-div"]').text()).toContain('Your list is empty.')
  })

  it('shows the hint when there is one', () => {
    wrapper = mountWrapper({ title: 'Your list is empty.', hint: 'Add a show with the + button.' })

    expect(wrapper.text()).toContain('Add a show with the + button.')
  })

  it('leaves out the hint when there is none', () => {
    wrapper = mountWrapper({ title: 'Empty' })
    expect(wrapper.find('.state__hint').exists()).toBe(false)
  })

  it('uses the data-test name it is given', () => {
    wrapper = mountWrapper({ title: 'Empty', test: 'home-empty' })
    expect(wrapper.find('[data-test="home-empty"]').exists()).toBe(true)
  })

  it('has no retry button by default', () => {
    wrapper = mountWrapper({ title: 'Empty' })
    expect(wrapper.find('[data-test="state-retry-btn"]').exists()).toBe(false)
  })

  it('offers a retry button labelled "Try again"', () => {
    wrapper = mountWrapper({ title: 'Something went wrong', retry: true })
    expect(wrapper.get('[data-test="state-retry-btn"]').text()).toBe('Try again')
  })

  it('uses a custom action label when it is given', () => {
    wrapper = mountWrapper({ title: 'More', retry: true, actionLabel: 'Load more' })

    expect(wrapper.get('[data-test="state-retry-btn"]').text()).toBe('Load more')
  })

  it('asks the page to retry when the button is pressed', async () => {
    wrapper = mountWrapper({ title: 'Something went wrong', retry: true })

    await wrapper.get('[data-test="state-retry-btn"]').trigger('click')

    expect(wrapper.emitted('on-retry')).toHaveLength(1)
  })

  it('marks an error variant', () => {
    wrapper = mountWrapper({ title: 'Boom', variant: 'error' })
    expect(wrapper.get('[data-test="state-div"]').classes()).toContain('state--error')
  })
})
