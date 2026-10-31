with open('index.html','r',encoding='utf-8') as f:
    content = f.read()
start_idx = content.find('<section class="screen equalizer-screen"')
end_idx = content.find('<section class="screen settings-screen"', start_idx)
new_block = open('new_eq_block.html').read()
new_content = content[:start_idx] + new_block + content[end_idx:]
with open('index.html','w',encoding='utf-8') as f:
    f.write(new_content)
print('done')
