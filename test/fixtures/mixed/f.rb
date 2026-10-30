class Cart
  def total
    items.sum
    tax()
  end
  def tax; end
end
